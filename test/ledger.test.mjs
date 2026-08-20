/** Ledger rules. Run with `npm test`.
 *
 *  pg-mem backs the schema tests. It is reliable for DDL and constraint
 *  enforcement, but NOT for result assertions on this schema: it will answer a
 *  query from a partial index whose predicate the query does not imply, so
 *  `SELECT ... WHERE wallet=$1 AND ended_at IS NOT NULL` wrongly returns zero
 *  rows once soft_stakes_wallet_active exists. Real Postgres never does this.
 *  Aggregate/count assertions therefore live against real Postgres (see README),
 *  and everything below sticks to constraints and the pure accrual rule.
 */
import { newDb } from "pg-mem";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const DAY_SECONDS = 86_400;
const BALLS_PER_DAY = 3;
const SECONDS_PER_BALL = DAY_SECONDS / BALLS_PER_DAY;

/** Mirrors ballsBetween() in api/_lib/db.ts. The tripwire test below fails if
 *  that definition changes without this one following. */
function ballsBetween(from, to) {
  const seconds = Math.floor((to.getTime() - from.getTime()) / 1000);
  return Math.max(0, Math.floor(seconds / SECONDS_PER_BALL));
}

const schemaPath = new URL("../db/schema.sql", import.meta.url);

function freshDb() {
  const pg = newDb().public;
  pg.none(readFileSync(schemaPath, "utf8"));
  return pg;
}

const W1 = "0xaaaa000000000000000000000000000000000001";
const W2 = "0xbbbb000000000000000000000000000000000002";
const days = (n) => n * DAY_SECONDS * 1000;

// ---------- schema ----------

test("schema applies cleanly and accepts active stakes", () => {
  const pg = freshDb();
  pg.none(`INSERT INTO soft_stakes (wallet, token_id) VALUES ('${W1}','10'), ('${W1}','11')`);
  assert.equal(pg.many(`SELECT count(*)::int c FROM soft_stakes WHERE ended_at IS NULL`)[0].c, 2);
});

test("a token cannot be actively staked by two wallets at once", () => {
  const pg = freshDb();
  pg.none(`INSERT INTO soft_stakes (wallet, token_id) VALUES ('${W1}','10')`);
  assert.throws(
    () => pg.none(`INSERT INTO soft_stakes (wallet, token_id) VALUES ('${W2}','10')`),
    "the partial unique index must reject a second active stake"
  );
});

test("a token is claimable again once its previous stake ended", () => {
  const pg = freshDb();
  pg.none(`INSERT INTO soft_stakes (wallet, token_id) VALUES ('${W1}','10')`);
  pg.none(`UPDATE soft_stakes SET ended_at = now(), ended_reason = 'unstaked', balls_credited = 3
            WHERE token_id = '10'`);
  pg.none(`INSERT INTO soft_stakes (wallet, token_id) VALUES ('${W2}','10')`);
  assert.equal(
    pg.many(`SELECT wallet w FROM soft_stakes WHERE token_id='10' AND ended_at IS NULL`)[0].w,
    W2
  );
});

test("ended_reason rejects unknown values but allows NULL while active", () => {
  const pg = freshDb();
  pg.none(`INSERT INTO soft_stakes (wallet, token_id) VALUES ('${W1}','10')`);
  assert.throws(() =>
    pg.none(`INSERT INTO soft_stakes (wallet, token_id, ended_at, ended_reason)
             VALUES ('${W1}','11', now(), 'bogus')`)
  );
  pg.none(`INSERT INTO soft_stakes (wallet, token_id, ended_at, ended_reason, balls_credited)
           VALUES ('${W1}','12', now(), 'transferred', 2)`);
});

test("a nonce can only be recorded once", () => {
  const pg = freshDb();
  pg.none(`INSERT INTO auth_nonces (nonce, wallet) VALUES ('abc', '${W1}')`);
  assert.throws(() => pg.none(`INSERT INTO auth_nonces (nonce, wallet) VALUES ('abc', '${W2}')`));
});

// ---------- accrual ----------

test("accrual is three balls per day, floored to the 8-hour tick", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  assert.equal(ballsBetween(new Date(now - days(5)), now), 15, "5 days at 3/day");
  assert.equal(ballsBetween(new Date(now - days(1)), now), BALLS_PER_DAY, "one day is exactly 3");
  assert.equal(ballsBetween(new Date(now - 8 * 3600 * 1000), now), 1, "first ball lands at 8 hours");
  assert.equal(
    ballsBetween(new Date(now - 8 * 3600 * 1000 + 1000), now),
    0,
    "a second short of 8 hours is still 0"
  );
  assert.equal(ballsBetween(new Date(now - 47 * 3600 * 1000), now), 5, "47 hours is 5, not 6");
  assert.equal(ballsBetween(now, now), 0);
});

test("a stake dated in the future never yields negative balls", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  assert.equal(ballsBetween(new Date(now.getTime() + days(3)), now), 0);
});

test("selling banks balls up to the transfer, not to when we noticed", () => {
  const stakedAt = new Date("2026-08-01T00:00:00Z");
  const soldAt = new Date("2026-08-05T00:00:00Z");
  const noticedAt = new Date("2026-08-20T00:00:00Z");
  assert.equal(ballsBetween(stakedAt, soldAt), 12, "4 days held at 3/day");
  assert.equal(ballsBetween(stakedAt, noticedAt), 57);
  assert.notEqual(
    ballsBetween(stakedAt, soldAt),
    ballsBetween(stakedAt, noticedAt),
    "crediting at detection would overpay by 45 balls here"
  );
});

test("the API's accrual rule still matches the one asserted above", () => {
  const source = readFileSync(new URL("../api/_lib/db.ts", import.meta.url), "utf8");
  assert.match(
    source,
    /Math\.max\(0,\s*Math\.floor\(seconds\s*\/\s*SECONDS_PER_BALL\)\)/,
    "api/_lib/db.ts changed its accrual formula — update this test's mirror to match"
  );
  assert.match(source, /DAY_SECONDS = 86_400/);
  assert.match(source, /BALLS_PER_DAY = 3/, "API ball rate drifted from the client's");
});
