#!/usr/bin/env node
/** Apply db/schema.sql to DATABASE_URL, then report what's there.
 *
 *  Reads .env.local directly so the connection string — which contains your
 *  database password — never has to be pasted anywhere else. The schema is
 *  idempotent (every statement is IF NOT EXISTS), so this is safe to re-run.
 *
 *    npm run db:migrate
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const file = resolve(root, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (!process.env[key]) process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.\n");
  console.error("Add it to .env.local, then re-run:");
  console.error("  DATABASE_URL=postgresql://user:password@host:port/database\n");
  console.error("See the README for where to get one.");
  process.exit(1);
}

const redacted = url.replace(/:\/\/([^:]+):[^@]+@/, "://$1:••••@");
console.log(`Connecting to ${redacted}`);

// Supabase and Neon both require TLS; a local Postgres generally doesn't.
const isLocal = /@(localhost|127\.0\.0\.1)/.test(url);
const client = new pg.Client({
  connectionString: url,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();

  const { rows: version } = await client.query("SELECT version()");
  console.log(`  ${version[0].version.split(",")[0]}`);

  // A pooled string is what serverless needs — flag a direct one rather than
  // letting it fail later under load.
  if (!/pooler|pgbouncer|-pooler\./.test(url) && !isLocal && !url.includes("6543")) {
    console.warn("\n  ! This looks like a DIRECT connection string.");
    console.warn("    Serverless functions open many short-lived connections and will");
    console.warn("    exhaust it. Use the POOLED / transaction-mode string for deploys.");
  }

  console.log("\nApplying db/schema.sql …");
  await client.query(readFileSync(resolve(root, "db/schema.sql"), "utf8"));

  const { rows: tables } = await client.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log("\nTables now present:");
  for (const t of tables) {
    const { rows } = await client.query(`SELECT count(*)::int AS c FROM "${t.table_name}"`);
    console.log(`  ${t.table_name.padEnd(14)} ${rows[0].c} rows`);
  }

  console.log("\nDone. Set VITE_BLNK_MODE=live and soft-staking is active.");
} catch (error) {
  console.error(`\nFailed: ${error.message}`);
  if (/self.signed|certificate/i.test(error.message)) {
    console.error("TLS issue — check the host allows external connections.");
  }
  if (/password|authentication/i.test(error.message)) {
    console.error("Check the password in the connection string is URL-encoded.");
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
