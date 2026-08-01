import fs from "node:fs";
import pg from "pg";

const env = {};
for (const line of fs.readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const ref = env.SUPABASE_PROJECT_ID;
const pass = env.SUPABASE_DB_PASSWORD;

async function tryConnect(label, host, port, user) {
  const cs = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/postgres`;
  const client = new pg.Client({
    connectionString: cs,
    ssl: { rejectUnauthorized: false, servername: host },
  });
  try {
    await client.connect();
    const r = await client.query("select current_database() as db, current_user as usr");
    console.log(`OK ${label}`, r.rows[0]);
    await client.end();
    return true;
  } catch (e) {
    console.log(`FAIL ${label}:`, e.message);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

if (env.DATABASE_URL) {
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log("OK DATABASE_URL from .env");
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log("FAIL DATABASE_URL:", e.message);
  }
}

const explicit = env.SUPABASE_POOLER_HOST;
if (explicit) {
  if (await tryConnect(`pooler ${explicit}:5432`, explicit, 5432, `postgres.${ref}`)) process.exit(0);
  if (await tryConnect(`pooler ${explicit}:6543`, explicit, 6543, `postgres.${ref}`)) process.exit(0);
}

const direct = `db.${ref}.supabase.co`;
if (await tryConnect(`direct ${direct}`, direct, 5432, "postgres")) process.exit(0);
if (await tryConnect(`direct pooler-user ${direct}`, direct, 5432, `postgres.${ref}`)) process.exit(0);

console.log("\nNo connection worked. Add DATABASE_URL or SUPABASE_POOLER_HOST from Dashboard → Database → Connection string (Session pooler).");
process.exit(1);
