/** Verify product-reviews cron schedules via Cloudflare API. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WORKER = "recenze-ceny";
const EXPECTED = ["*/30 * * * *"];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const token = process.env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_TOKEN;
const accountId = env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !accountId) {
  console.error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID required in .env");
  process.exit(1);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${WORKER}/schedules`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
const json = await res.json();
const schedules = json.result?.schedules ?? [];
console.log(JSON.stringify(schedules, null, 2));

const found = new Set(schedules.map((s) => s.cron));
const missing = EXPECTED.filter((c) => !found.has(c));
if (missing.length) {
  console.error(`\nMissing cron triggers: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`\nOK — ${EXPECTED.length} cron triggers on ${WORKER}`);
