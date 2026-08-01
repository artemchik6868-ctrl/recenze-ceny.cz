import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const envPath = new URL("../.env", import.meta.url);
const env = {};
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const keys = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "HOOK_SECRET",
  "KMA_API_KEY",
  "KMA_SOURCE_ID",
  "CPAGETTI_API_TOKEN",
  "CPA_TL_API_KEY",
  "ADCOMBO_API_KEY",
  "SHAKES_API_KEY",
  "SHAKES_STREAM_CODE",
  "TERRALEADS_USER_ID",
  "TERRALEADS_API_KEY",
  "TERRALEADS_PUBLIC_KEY",
  "TERRALEADS_STREAM_ID",
  "M1_TOP_API_KEY",
  "M1_TOP_WEBMASTER_ID",
  "AI_GATEWAY_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "IMAGE_FACTS_ENABLED",
  "IMAGE_FACTS_MODEL",
  "IMAGE_FACTS_MAX_LLM_PER_DAY",
  "IMAGE_FACTS_MAX_PAID_PER_DAY",
  "IMAGE_FACTS_MAX_TOKENS_PER_DAY",
  "IMAGE_FACTS_MAX_LLM_PER_IMAGE",
  "INDEXNOW_KEY",
  "GOOGLE_INDEXING_SA_JSON",
  "VITE_GA4_ID",
];

const payload = {};
for (const k of keys) {
  if (env[k]) payload[k] = env[k];
}
payload.SITE_URL = "https://recenze-ceny.cz";
payload.SITE_ORIGIN = "https://recenze-ceny.cz";
// CPA.tl landing facts: prod uses cpa_tl_landing_facts DB drain (no live flags).
// IndexNow key file lives at /{key}.txt on apex; default to HOOK_SECRET when unset.
if (!payload.INDEXNOW_KEY && payload.HOOK_SECRET) {
  payload.INDEXNOW_KEY = payload.HOOK_SECRET;
}

const tmp = join(tmpdir(), `cf-secrets-${Date.now()}.json`);
writeFileSync(tmp, JSON.stringify(payload));
try {
  execSync(`npx wrangler secret bulk "${tmp}" --config .output/server/wrangler.json`, {
    stdio: "inherit",
    shell: true,
  });
  console.log(`Uploaded ${Object.keys(payload).length} secrets to bg-otzivi`);
} finally {
  unlinkSync(tmp);
}
