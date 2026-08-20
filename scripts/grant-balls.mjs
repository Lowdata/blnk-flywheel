/** Issues a manual Colour Ball grant.
 *
 *    npm run grant -- <wallet> <balls> "<reason>"
 *    npm run grant -- 0xabc… 12 "launch competition winner"
 *
 *  Balls may be negative to claw a grant back — the correction is appended, not
 *  edited over the original, so the history stays readable.
 */
import { Client } from "pg";

const [wallet, ballsRaw, ...reasonParts] = process.argv.slice(2);
const reason = reasonParts.join(" ").trim();
const balls = Number(ballsRaw);

if (!/^0x[a-fA-F0-9]{40}$/.test(wallet ?? "")) {
  console.error('Usage: npm run grant -- <wallet> <balls> "<reason>"');
  process.exit(1);
}
if (!Number.isInteger(balls) || balls === 0) {
  console.error("balls must be a non-zero integer");
  process.exit(1);
}
if (!reason) {
  console.error("A reason is required — a grant with no stated cause is unauditable.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. See .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

await client.connect();
try {
  // Addresses are stored lowercase everywhere; a checksummed argument would
  // otherwise create a grant the API never finds.
  const owner = wallet.toLowerCase();

  const { rows } = await client.query(
    `INSERT INTO ball_grants (wallet, balls, reason) VALUES ($1, $2, $3)
     RETURNING id, granted_at`,
    [owner, balls, reason]
  );

  const { rows: totals } = await client.query(
    `SELECT COALESCE(SUM(balls), 0)::int AS total FROM ball_grants WHERE wallet = $1`,
    [owner]
  );

  console.log(`Granted ${balls} ball(s) to ${owner} — "${reason}"`);
  console.log(`  grant #${rows[0].id} at ${rows[0].granted_at.toISOString()}`);
  console.log(`  granted balls for this wallet now total ${totals[0].total}`);
} finally {
  await client.end();
}
