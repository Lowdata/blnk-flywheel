# $BLNK Holder Hub

Soft-staking dashboard for the **[BLNK](https://opensea.io/collection/blnkonrobinhood)**
collection on **Robinhood Chain** — see your NFTs, opt them into soft-staking, and watch
Color Balls accrue at 1/day.

The UI follows **[blnkinc.xyz](https://blnkinc.xyz/)**. Tokens in `src/theme/palette.ts` are
lifted from that site's own stylesheet rather than eyeballed:

| | |
| --- | --- |
| Background / ink / paper | `#0a0a0c` · `#0e0e0e` · `#f7f6f3` |
| Greys | `#4a4d52` · `#9aa0a6` · `#d6d9dc` |
| Colour | lime `#d4ff00` · green `#4ade80` · violet `#7b2ff7` · magenta `#ff2e93` · orange `#ff6b35` · gold `#ffc93c` |
| Primary action | `linear-gradient(90deg, #ccff00, #4ade80)`, pill `999px` |
| Panels | `linear-gradient(160deg, #1a1a1a, #232323)`, radius `16–20px` |
| Type | Inter (body) · Montserrat (display) · Silkscreen (pixel labels) |

The site's premise — *"the world stays grey until you fill it"* — drives the one piece of
interaction design that isn't on the marketing site: **a token that isn't soft-staked renders
desaturated, and fills with colour when it starts earning.** Status reads as "Grey" and
"Filling" rather than staking jargon, and the action buttons are "Fill" and "Stop".

```bash
npm install
npm run dev      # app + the api/ routes, served by the Vite dev server
npm test         # ledger + accrual rules
```

`api/` holds Vercel serverless functions, which plain `vite` does not know about — Fill and
Stop would 404 locally. `vite-plugin-vercel-api.ts` mounts those same handlers on the dev
server and loads the non-`VITE_` secrets from `.env.local`, so local dev exercises the real
routes. Put a pooled `DATABASE_URL` in `.env.local` and run `npm run db:setup` to apply
`db/schema.sql`; without a database the write routes answer `503` rather than failing
obscurely. `vercel dev` is still the faithful
runtime if you need to check platform behaviour.

## How soft-staking works

There is **no staking contract**. Nothing is escrowed and no transaction is ever sent.

1. A holder connects their wallet and opts tokens into soft-staking.
2. They sign a message proving they control the wallet — no gas, no funds moved. The
   message **names every token** in the request, so the signature authorises that exact set
   and nothing else, and its nonce is single-use and expires in 10 minutes.
3. The server verifies that signature *and* checks `ownerOf` on-chain before writing. It
   rebuilds the signed text from the tokens in the request, so a list tampered with in
   transit produces a different message and fails verification.
4. From that moment the token earns **3 balls/day**, for as long as they still hold it.
5. If it's sold or transferred out, the stake closes and the balls earned **up to the
   transfer** are banked. The new owner starts from zero when they opt in.

Accrual is always derived from a `staked_at` timestamp, never stored as a counter — a
counter would be wrong the moment a day boundary passed without a write.

The balance is `accrued + credited − spent`. Balls were derived-only until spending existed;
without the `ball_spends` debit side a balance could only ever rise, so a holder could claim
the same allowlist spot forever. Concurrency is handled with a per-wallet advisory lock plus a
unique index on `(wallet, reason, ref)` — the balance check alone loses a race between two
simultaneous claims.

## Architecture

```
components → hooks → BlnkAdapter → mock.ts | api.ts
                                              ↓
                                    /api/* (Vercel functions)
                                       ├── Postgres    — soft-stake ledger
                                       ├── Blockscout  — holdings + artwork
                                       └── Robinhood RPC — ownerOf verification
```

**No component imports `wagmi` or `viem`.** The UI talks to hooks, hooks talk to
`BlnkAdapter`, and only the adapter knows where data comes from. That's why swapping the
entire backend — from an imagined staking contract to a database — changed no UI code.

| File | Role |
| --- | --- |
| `src/contracts/adapter.ts` | The interface. Five methods, chain-free types. |
| `src/contracts/mock.ts` | Deterministic fixtures. Default; reproduces 5 earning / 42 balls. |
| `src/contracts/api.ts` | Live: signed writes, reads via `/api/holder`. |
| `api/_lib/holder.ts` | Reads holdings and reconciles them against the ledger. |
| `api/_lib/auth.ts` | Nonce issue + signature verification + replay prevention. |
| `db/schema.sql` | The ledger. |

### API

| Route | Purpose |
| --- | --- |
| `POST /api/nonce` | Issue a single-use nonce and the exact message to sign. |
| `GET /api/holder?wallet=` | Holdings + stake state + ball totals. Also reconciles departed tokens. |
| `POST /api/stake` | Signature + on-chain ownership verified, then opt in. |
| `POST /api/unstake` | Signature verified, stake closed, balls banked. |

Writes are gated twice over: the signature proves wallet control, and `ownerOf` proves the
tokens are actually held. **The client's claim about what it owns is never trusted.** Nonces
are single-use and expire in 10 minutes, so a captured signature can't be replayed — and
because the action is part of the signed message, a stake signature can't be reused to
unstake.

## Network

Robinhood Chain, an Arbitrum L2 on Ethereum with ETH as native gas
([docs](https://docs.robinhood.com/chain/connecting/)). No API key, no secrets:

| | |
| --- | --- |
| Chain id | `4663` |
| RPC | `https://rpc.mainnet.chain.robinhood.com` (public) |
| Explorer | `https://robinhoodchain.blockscout.com` |
| BLNK contract | `0xa4598B513341CBeb37901e5f579cDa39E204077a` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

Two constraints worth knowing before changing the data layer:

- **BLNK is not ERC721Enumerable** — `tokenOfOwnerByIndex` reverts. A wallet's holdings
  cannot be read from the contract, which is why Blockscout indexes them for us. It also
  resolves the IPFS artwork.
- **The public RPC is rate-limited** and, per Robinhood's docs, "not recommended for
  production use." It fails as sporadic read errors rather than a clean outage. Set
  `VITE_RPC_URL` / `RPC_URL` to Alchemy, QuickNode, or dRPC before launch. While the public
  node is in use, the header says so.

## Deploying

1. Provision Postgres and apply `db/schema.sql`.
2. Set `DATABASE_URL` in Vercel to the **pooled** connection string.
3. Set `VITE_BLNK_MODE=live`.
4. Deploy. `vercel.json` serves the SPA and routes `/api/*` to the functions.

## Dev state switcher

Real wallets are a bad way to reach edge cases on demand. Dev only:

| URL | State |
| --- | --- |
| `/` | Happy path — 6 NFTs, 5 filling |
| `/?state=disconnected` | Connect gate |
| `/?state=loading` | Skeleton grid |
| `/?state=empty` | Wallet holds no BLNK |
| `/?state=error` | Indexer failure + retry |
| `/?state=wrongnet` | Wrong-network banner + switch |
| `/?mock=200` | Whale wallet — proves only the NFT column scrolls |

## Artwork

BLNK's metadata points at `ipfs://QmRM4suZ…/<tokenId>`, and **only ~22% of those files are
retrievable over IPFS**. The directory itself is healthy — all 3,444 entries list in under a
second — but most image blocks aren't served. This is not a cold cache: running
`node scripts/check-ipfs-coverage.mjs 85 115` twice returns the identical hits and misses.

**OpenSea's CDN is the working source — 100% coverage.** It indexed the collection while the
art was available and serves it from `i2c.seadn.io`: public, `access-control-allow-origin: *`,
`cache-control: max-age=31536000`. The URLs are content-hashed, so they can't be derived and
must come from the API (chain slug `robinhood`).

```
GET /api/images?wallet=0x…  ->  { images: { "110": "https://i2c.seadn.io/robinhood/…" } }
```

Artwork resolution is deliberately **independent of the ledger** — it needs no database, so
holders see their NFTs before soft-staking is provisioned. With `DATABASE_URL` set, results
cache in `nft_images` so a page load never waits on OpenSea or burns its quota.

Tokens OpenSea doesn't know about keep their IPFS URI and fall back through
`src/lib/ipfs.ts`, then to the deterministic colour swatch. The long-term fix is for the
collection to re-pin its image CID — OpenSea's cache is a borrowed copy.

## Getting a DATABASE_URL

Any Postgres works — the API uses `pg` and is provider-agnostic. Two good options:

**Supabase** (you already use it elsewhere)
1. supabase.com → **New project**, set a database password
2. **Project Settings → Database → Connection string → Transaction pooler**
3. Copy it; it looks like
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`

**Neon** (smoothest on Vercel)
1. neon.tech → **New project**
2. Copy the **Pooled connection** string — its host contains `-pooler`
3. Or, from the Vercel dashboard: **Storage → Create Database → Neon**, which wires
   `DATABASE_URL` into the deployment automatically

### Use the POOLED string

Serverless functions open many short-lived connections and will exhaust a direct one under
load. Supabase's pooled string is port **6543** (not 5432); Neon's host contains `-pooler`.
`npm run db:migrate` warns if the string doesn't look pooled.

### Then

```bash
# paste into .env.local — it contains your database password, so keep it out of chat,
# commits, and screenshots
DATABASE_URL=postgresql://…

npm run db:migrate     # idempotent; safe to re-run
```

The migration prints the tables and row counts it finds, so you can see it worked.

## Local development

`npm run dev` runs the `/api` functions inside Vite via `vite-api-plugin.ts`, which adapts
Node's req/res to the shape the Vercel handlers expect and loads non-`VITE_` secrets from
`.env.local` into `process.env`. Without it the dev server serves only the SPA, every `/api`
call 404s, and anything needing a server-side key is untestable until deploy.

**Server-side keys must never take a `VITE_` prefix.** Vite inlines those into the browser
bundle, which would publish them.

## Testing notes

`npm test` covers the schema's guarantees and the accrual rule. It uses **pg-mem**, which is
reliable for DDL and constraints but *not* for result assertions here: it will answer a query
from a partial index whose predicate the query doesn't imply, so
`WHERE wallet = $1 AND ended_at IS NOT NULL` wrongly returns zero rows. Real Postgres never
does this. Aggregate behaviour should be re-checked against a real database before launch.

The layout contract — page never scrolls, only the NFT column does — is verified at 1440×900
with both 6 and 200 tokens.
