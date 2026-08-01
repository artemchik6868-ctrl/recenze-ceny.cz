/**
 * Verify required Worker secrets exist locally and on Cloudflare.
 * Run: node scripts/verify-workers-secrets.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "HOOK_SECRET",
  "KMA_API_KEY",
  "KMA_SOURCE_ID",
  "CPAGETTI_API_TOKEN",
  "CPA_TL_API_KEY",
  "M1_TOP_API_KEY",
  "M1_TOP_WEBMASTER_ID",
  "ADCOMBO_API_KEY",
  "SHAKES_API_KEY",
  "SHAKES_STREAM_CODE",
  "TERRALEADS_USER_ID",
  "TERRALEADS_API_KEY",
  "TERRALEADS_PUBLIC_KEY",
  "AI_API_KEY",
  "AI_MODEL",
];

const OPTIONAL = ["TERRALEADS_STREAM_ID", "GOOGLE_INDEXING_SA_JSON", "INDEXNOW_KEY", "VITE_GA4_ID"];

function loadLocalEnv() {
  const env = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

function listWorkerSecrets() {
  const out = execSync("npx wrangler secret list --config .output/server/wrangler.json", {
    cwd: root,
    encoding: "utf8",
  });
  return JSON.parse(out).map((s) => s.name);
}

const local = loadLocalEnv();
const worker = listWorkerSecrets();

const localMissing = REQUIRED.filter((k) => !local[k]?.trim());
const workerMissing = REQUIRED.filter((k) => !worker.includes(k));
const optionalMissing = OPTIONAL.filter((k) => !local[k]?.trim() && !worker.includes(k));

const report = {
  ok: localMissing.length === 0 && workerMissing.length === 0,
  local: { set: REQUIRED.length - localMissing.length, total: REQUIRED.length, missing: localMissing },
  worker: { set: REQUIRED.length - workerMissing.length, total: REQUIRED.length, missing: workerMissing },
  optionalMissing,
};

console.log(JSON.stringify(report, null, 2));

mkdirSync(resolve(root, "scripts", ".cache"), { recursive: true });
writeFileSync(resolve(root, "scripts", ".cache", "secrets-audit.json"), JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error("\nverify-workers-secrets: FAIL — fix missing keys (npm run secrets:cloudflare after .env)");
  process.exit(1);
}
if (optionalMissing.length) {
  console.warn("\nOptional missing:", optionalMissing.join(", "));
}
console.log("\nverify-workers-secrets: OK");
