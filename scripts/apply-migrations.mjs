import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] === undefined) {
      process.env[key] = m[2].trim().replace(/^"|"$/g, "");
    }
  }
}

const projectRef = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
const password = process.env.SUPABASE_DB_PASSWORD;
const migrationsDir = path.resolve("supabase/migrations");

if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_ID environment variable.");
  console.error("Use the IT Supabase project ref (not the UA project).");
  process.exit(1);
}

if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD environment variable.");
  console.error(
    "Set it to your Supabase database password (Settings → Database → Database password).",
  );
  process.exit(1);
}

const POOLER_PREFIXES = ["aws-0", "aws-1"];
const POOLER_REGIONS = [
  "ca-central-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "us-east-1",
  "us-west-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "sa-east-1",
];

function makeClient({ host, user }) {
  const hostForUrl =
    host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${user}:${encodeURIComponent(password)}@${hostForUrl}:5432/postgres`;
  const sslServername =
    process.env.SUPABASE_DB_SSL_SERVERNAME ||
    (host.includes("pooler.supabase.com")
      ? host
      : `db.${projectRef}.supabase.co`);

  return new pg.Client({
    connectionString: process.env.DATABASE_URL || connectionString,
    ssl: {
      rejectUnauthorized: false,
      servername: sslServername,
    },
  });
}

async function tryConnect(host, user) {
  const client = makeClient({ host, user });
  try {
    await client.connect();
    return client;
  } catch (err) {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    throw err;
  }
}

async function connectClient() {
  if (process.env.DATABASE_URL) {
    const client = makeClient({ host: "custom", user: "postgres" });
    await client.connect();
    return client;
  }

  const explicitHost = process.env.SUPABASE_DB_HOST || process.env.SUPABASE_POOLER_HOST;
  if (explicitHost) {
    const user =
      process.env.SUPABASE_DB_USER ||
      (explicitHost.includes("pooler.supabase.com")
        ? process.env.SUPABASE_POOLER_USER || `postgres.${projectRef}`
        : "postgres");
    try {
      const client = await tryConnect(explicitHost, user);
      console.log(`Connected via ${explicitHost}`);
      return client;
    } catch (err) {
      console.warn(`Explicit host ${explicitHost} failed (${err.message}); trying other poolers…`);
    }
  }

  const directHost = `db.${projectRef}.supabase.co`;
  try {
    const client = await tryConnect(directHost, "postgres");
    console.log(`Connected via ${directHost}`);
    return client;
  } catch (directErr) {
    console.warn(`Direct DB connect failed (${directErr.message}); trying pooler…`);
  }

  const errors = [];
  for (const prefix of POOLER_PREFIXES) {
    for (const region of POOLER_REGIONS) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      const user = `postgres.${projectRef}`;
      try {
        const client = await tryConnect(host, user);
        console.log(`Connected via pooler ${host}`);
        return client;
      } catch (err) {
        errors.push(`${host}: ${err.message}`);
      }
    }
  }

  console.error("Could not connect to Supabase Postgres.");
  for (const line of errors) console.error(`  ${line}`);
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = await connectClient();

try {
  await client.query(`
  CREATE SCHEMA IF NOT EXISTS supabase_migrations;
  CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    statements text[],
    name text
  );
`);

  const applied = new Set(
    (
      await client.query(
        "SELECT version FROM supabase_migrations.schema_migrations",
      )
    ).rows.map((r) => r.version),
  );

  console.log(`Found ${files.length} migration file(s).`);

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) {
      console.log(`skip  ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`apply ${file}`);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ($1, $2)",
        [version, file],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Failed on ${file}:`, err.message);
      process.exitCode = 1;
      break;
    }
  }

  if (!process.exitCode) {
    console.log("All migrations applied successfully.");
  }
} finally {
  await client.end();
}
