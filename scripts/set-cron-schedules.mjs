/** PUT cron schedules for product-reviews worker via Cloudflare API. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WORKER = "recenze-ceny";
const SCHEDULES = [
  { cron: "0 2 * * *" },
  { cron: "*/30 * * * *" },
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const token = env.CLOUDFLARE_API_TOKEN;
const accountId = env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !accountId) {
  console.error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID required");
  process.exit(1);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${WORKER}/schedules`;
const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(SCHEDULES),
});
const text = await res.text();
console.log(`Status: ${res.status}`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}
if (!res.ok) process.exit(1);
