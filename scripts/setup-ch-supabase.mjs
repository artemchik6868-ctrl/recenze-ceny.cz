/**
 * CH Supabase bootstrap: guard against DE/AT projects, migrate schema.
 * Usage: node scripts/setup-cz-supabase.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DE_PROJECT_REF = "ahxnadphhxckoknooyis";
const AT_PROJECT_REF = "lheddhbgyspnrsnqcazn";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

const env = loadEnv();
const projectRef = env.VITE_SUPABASE_PROJECT_ID || env.SUPABASE_PROJECT_ID;

if (!projectRef) {
  console.error("Missing VITE_SUPABASE_PROJECT_ID in .env");
  process.exit(1);
}

if (projectRef === DE_PROJECT_REF || projectRef === AT_PROJECT_REF) {
  console.error(`
CH Supabase setup blocked: .env points to DE/AT project (${projectRef}).
Create a new Supabase project (recenze-ceny-ch), update .env, then re-run:
  npm run setup:supabase
`);
  process.exit(1);
}

console.log(`setup-ch-supabase: migrating project ${projectRef}...`);
const migrate = spawnSync("npm", ["run", "db:migrate"], { cwd: root, stdio: "inherit", shell: true });
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

console.log("setup-ch-supabase: OK — schema migrated (product images are partner hotlinks; no Storage watermark step)");
