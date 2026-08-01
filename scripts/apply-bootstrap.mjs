import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const projectRef = process.env.SUPABASE_PROJECT_ID;

if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_ID (IT Supabase project ref)");
  process.exit(1);
}

const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL ||
  (() => {
    const host =
      process.env.SUPABASE_DB_HOST ||
      `db.${projectRef}.supabase.co`;
    const hostForUrl =
      host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
    return `postgresql://postgres:${encodeURIComponent(password)}@${hostForUrl}:5432/postgres`;
  })();

const bootstrap = fs.readFileSync(
  path.resolve("supabase/_bootstrap.sql"),
  "utf8",
);

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
    servername: `db.${projectRef}.supabase.co`,
  },
});

try {
  console.log("Connecting...");
  await client.connect();

  console.log("Resetting public schema...");
  await client.query(`
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT ALL ON SCHEMA public TO public;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
`);

  console.log("Applying bootstrap schema...");
  await client.query(bootstrap);

  console.log("Bootstrap applied successfully.");
} finally {
  await client.end();
}
