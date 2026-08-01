/**
 * Build SL .env from ES sibling + fresh SI-only secrets.
 * Usage: node scripts/bootstrap-sl-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const esEnvPath = resolve(root, "..", "offer-pulse-showcase-es", ".env");
const slEnvPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

function hex(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

const es = existsSync(esEnvPath) ? parseEnv(readFileSync(esEnvPath, "utf8")) : {};
const example = parseEnv(readFileSync(examplePath, "utf8"));
const out = { ...example };

const COPY_FROM_ES = [
  "KMA_API_KEY",
  "KMA_SOURCE_ID",
  "CPAGETTI_API_TOKEN",
  "CPA_TL_API_KEY",
  "M1_TOP_API_KEY",
  "M1_TOP_WEBMASTER_ID",
  "ADCOMBO_API_KEY",
  "SHAKES_API_KEY",
  "TERRALEADS_USER_ID",
  "TERRALEADS_API_KEY",
  "TERRALEADS_PUBLIC_KEY",
  "AI_GATEWAY_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
];

for (const k of COPY_FROM_ES) {
  if (es[k]) out[k] = es[k];
}

// SI-specific: generate fresh secrets (must differ from ES)
out.HOOK_SECRET = hex(24);
out.INDEXNOW_KEY = hex(16);
out.SITE_URL = "https://recenze-ceny.cz";
out.SITE_ORIGIN = "https://recenze-ceny.cz";

// SI stream IDs — placeholder until manager provides; keep ES value only as fallback with warning
if (es.SHAKES_STREAM_CODE) {
  console.warn("WARN: SHAKES_STREAM_CODE copied from ES — replace with SI stream ID when available.");
  out.SHAKES_STREAM_CODE = es.SHAKES_STREAM_CODE;
}
if (es.TERRALEADS_STREAM_ID) {
  out.TERRALEADS_STREAM_ID = es.TERRALEADS_STREAM_ID;
}

// Supabase: leave empty for new SI project
for (const k of [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
  "SUPABASE_PROJECT_ID",
  "SUPABASE_DB_PASSWORD",
]) {
  out[k] = "";
}

out.SUPABASE_POOLER_HOST = "aws-0-eu-central-1.pooler.supabase.com";

const lines = readFileSync(examplePath, "utf8").split(/\r?\n/).map((line) => {
  const m = line.match(/^([^#=]+)=/);
  if (!m) return line;
  const key = m[1].trim();
  if (!(key in out)) return line;
  return `${key}=${out[key]}`;
});

writeFileSync(slEnvPath, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${slEnvPath}`);
console.log(`HOOK_SECRET and INDEXNOW_KEY generated (SI-only).`);
console.log(`Supabase fields empty — fill after creating recenze-ceny-si project.`);
