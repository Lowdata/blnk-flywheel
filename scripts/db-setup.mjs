/** Applies db/schema.sql to whatever DATABASE_URL points at.
 *
 *  Saves needing psql installed locally, and the schema is written with
 *  IF NOT EXISTS throughout, so re-running it is a no-op rather than an error.
 *
 *    npm run db:setup
 */
import { readFileSync } from "node:fs";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL is not set.\n\n" +
      "Put a Postgres connection string in .env.local, then re-run:\n" +
      "  DATABASE_URL=postgresql://user:pass@host/db\n"
  );
  process.exit(1);
}

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

// Same rule the API uses: hosted Postgres terminates TLS with a cert chain we
// don't pin, local Postgres usually speaks plaintext.
const client = new Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(schema);

  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log("Schema applied. Tables:", rows.map((r) => r.table_name).join(", "));
} finally {
  await client.end();
}
