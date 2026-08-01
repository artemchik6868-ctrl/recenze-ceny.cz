/**
 * HU Supabase bootstrap: guard against wrong projects, migrate schema.
 * Usage: node scripts/setup-cz-supabase.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CH_PROJECT_REF = "ahxnadphhxckoknooyis";
const AT_PROJECT_REF = "lheddhbgyspnrsnqcazn";
const RO_PROJECT_REF = "iisxiwdybhxlkbhmjyfl";
const BG_PROJECT_REF = "ghztogkeofxtfwspdvol";
const HU_PROJECT_REF = "ueuhriesbkeoivcndzmx";

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

if (
  env.VITE_SUPABASE_PROJECT_ID &&
  env.SUPABASE_PROJECT_ID &&
  env.VITE_SUPABASE_PROJECT_ID !== env.SUPABASE_PROJECT_ID
) {
  console.error(`
HU Supabase setup blocked: SUPABASE_PROJECT_ID (${env.SUPABASE_PROJECT_ID})
does not match VITE_SUPABASE_PROJECT_ID (${env.VITE_SUPABASE_PROJECT_ID}).
Both must point to the HU project ${HU_PROJECT_REF}.
`);
  process.exit(1);
}

if (
  projectRef === CH_PROJECT_REF ||
  projectRef === AT_PROJECT_REF ||
  projectRef === RO_PROJECT_REF ||
  projectRef === BG_PROJECT_REF
) {
  console.error(`
HU Supabase setup blocked: .env points to wrong market project (${projectRef}).
Create a new Supabase project (velemenylab), update .env, then re-run:
  npm run setup:supabase
`);
  process.exit(1);
}

if (projectRef !== HU_PROJECT_REF) {
  console.warn(`setup-hu-supabase: expected HU project ${HU_PROJECT_REF}, got ${projectRef}`);
}

console.log(`setup-hu-supabase: migrating project ${projectRef}...`);
const migrate = spawnSync("npm", ["run", "db:migrate"], { cwd: root, stdio: "inherit", shell: true });
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

console.log("setup-hu-supabase: OK — schema migrated (product images are partner hotlinks; no Storage watermark step)");
