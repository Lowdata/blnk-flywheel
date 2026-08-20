-- BLNK soft-staking ledger.
--
-- There is no staking contract: a token is "soft staked" when its owner opts in
-- on the site with a signed message, and it keeps earning while they still hold
-- it. Accrual is 1 ball / day, derived from staked_at rather than stored as a
-- counter, so a row can never drift from wall-clock time.

CREATE TABLE IF NOT EXISTS soft_stakes (
  id             BIGSERIAL PRIMARY KEY,
  wallet         TEXT        NOT NULL,   -- lowercase 0x address
  token_id       TEXT        NOT NULL,   -- uint256 as text
  staked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Set when the holder unstakes, or when we detect the token left the wallet.
  ended_at       TIMESTAMPTZ,
  -- Balls banked at ended_at. Null while active; accrual is computed live.
  balls_credited INTEGER,
  -- Why the stake closed, for support questions later. NULL while active —
  -- spelled out rather than relying on NULL IN (...) evaluating to unknown.
  ended_reason   TEXT CHECK (ended_reason IS NULL OR ended_reason IN ('unstaked', 'transferred'))
);

-- A token can only be actively staked once, by one wallet, at a time.
CREATE UNIQUE INDEX IF NOT EXISTS soft_stakes_active_token
  ON soft_stakes (token_id) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS soft_stakes_wallet_active
  ON soft_stakes (wallet) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS soft_stakes_wallet ON soft_stakes (wallet);

-- Single-use nonces for wallet signature auth.
CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce      TEXT        PRIMARY KEY,
  wallet     TEXT        NOT NULL,
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS auth_nonces_issued ON auth_nonces (issued_at);

-- Artwork cache.
--
-- BLNK's IPFS images are unreachable, so the only working source is OpenSea's
-- CDN — and those URLs are content-hashed, so they must be fetched, not derived.
-- Caching them here means a page load never waits on OpenSea or burns its rate
-- limit. The URLs are immutable and CDN-cached for a year, so entries only need
-- refreshing if the collection's art itself changes.
CREATE TABLE IF NOT EXISTS nft_images (
  token_id   TEXT        PRIMARY KEY,
  image_url  TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT 'opensea',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manual ball grants — competitions, compensation, corrections.
--
-- Deliberately NOT rows in soft_stakes. A grant isn't a stake: it has no token,
-- no duration, and no accrual. Faking one there would put balls in the stake
-- history for a token the wallet may never have held, and quietly destroy the
-- one property that makes that table worth trusting.
--
-- Append-only by convention: to take balls back, insert a negative row rather
-- than editing or deleting an existing one, so the record of what happened
-- survives the correction.
CREATE TABLE IF NOT EXISTS ball_grants (
  id         BIGSERIAL   PRIMARY KEY,
  wallet     TEXT        NOT NULL,   -- lowercase 0x address
  balls      INTEGER     NOT NULL CHECK (balls <> 0),
  reason     TEXT        NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ball_grants_wallet ON ball_grants (wallet);

-- Ball spending.
--
-- Balls are otherwise *derived* — accrued from stake duration, plus what's
-- banked from ended stakes and granted manually. Without a debit side a balance
-- can only ever go up, so a holder could claim the same allowlist spot forever.
-- This table is that debit side.
CREATE TABLE IF NOT EXISTS ball_spends (
  id       BIGSERIAL   PRIMARY KEY,
  wallet   TEXT        NOT NULL,
  balls    INTEGER     NOT NULL CHECK (balls > 0),
  reason   TEXT        NOT NULL CHECK (reason IN ('whitelist', 'colour_machine')),
  -- What was bought: the allowlist project id, or the capsule. NULL only for
  -- spends with nothing to point at.
  ref      TEXT,
  spent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One claim per wallet per project. This is what actually stops double-claims;
-- the balance check alone would lose a race between two concurrent requests.
CREATE UNIQUE INDEX IF NOT EXISTS ball_spends_one_claim
  ON ball_spends (wallet, reason, ref) WHERE ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS ball_spends_wallet ON ball_spends (wallet);
