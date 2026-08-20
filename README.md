# BLNK

One repo, two apps, one deployment — `blnkinc.xyz`.

| Path | What it is | Built from |
| --- | --- | --- |
| `/` | The landing page: hero, the boy's story, the coin/task/referral game, `/dashboard` | Next.js app at the repo root (was `blnk-flywheel`) |
| `/marketplace` | The $BLNK **Holder Hub**: NFT holdings, soft-staking, Colour Balls, Whitelist Marketplace | Vite SPA in `marketplace-app/` (was `blnk-dashboard`) |

## Why two apps and not one

The Hub was originally ported into the Next app as a route, and its design did not
survive the trip. The cause was Tailwind **preflight**: the Hub's stylesheet is a
full `@import "tailwindcss"` that includes the global reset, while the landing page
is Chakra + `home.css` with a reset of its own. Preflight is global by nature, and
Next keeps a visited route's CSS in the document across client-side navigation — so
serving both from one document means one of the two resets is always wrong.

Giving the Hub its own document settles it. It builds with its own full Tailwind,
its reset stops at its own page, and its design is the design that was signed off,
not a re-implementation of it.

## Layout

```
app/                 Next routes — landing, game, dashboard, and /api/*
app/api/marketplace/ Hub API, thin route files over the handlers in marketplace/api/
marketplace/         Server-side Hub code: API handlers (api/) and chain config (chain/)
marketplace-app/     The Hub front end (Vite + React). Builds to public/marketplace/
db/                  Postgres schema for the ball ledger
scripts/             Ops: migrate, db-setup, grant-balls, ipfs coverage, seedTasks
public/marketplace/  Generated — the built Hub. Gitignored.
```

The Hub front end talks to `/api/marketplace/*`; that base is set in
`marketplace-app/vite.config.ts`, not in the component code.

## Running it

```bash
npm install
npm run dev          # builds the Hub, then starts Next on :3000
```

`/marketplace` is served from `public/marketplace/`, so **it does not hot-reload
with the Next dev server**. While working on the Hub, run it natively instead — it
proxies `/api` back to Next on :3000:

```bash
npm run dev              # terminal 1: Next, for the API and the landing page
npm run marketplace:dev  # terminal 2: Vite, with HMR
```

`npm run build` builds the Hub first and then Next, so a single Vercel build
produces both halves.

## Environment

`.env.local` at the root, server-side only:

| Key | Used for |
| --- | --- |
| `DATABASE_URL` | Neon Postgres — the ball ledger. Nothing writes without it. |
| `BLOCKSCOUT_API_KEY` | Holdings lookup (the contract is not ERC721Enumerable) |
| `OPENSEA_API_KEY` | Artwork — full coverage, where IPFS gives ~22% |
| `MONGODB_URI` | The landing page's game/task/referral state |
| `SECRET_COOKIE_PASSWORD` | `iron-session` cookie |

`VITE_WALLETCONNECT_PROJECT_ID` is unset, so the Hub offers injected wallets and
Coinbase only; set it in `marketplace-app/` to enable WalletConnect.

```bash
npm run db:migrate   # applies db/schema.sql, idempotent
npm test             # ledger tests
```
