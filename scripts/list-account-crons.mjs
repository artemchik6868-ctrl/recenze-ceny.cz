/** List cron schedules for all workers in the CH Cloudflare account. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const token = env.CLOUDFLARE_API_TOKEN;
const accountId = env.CLOUDFLARE_ACCOUNT_ID;

async function cf(path) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) {
    console.error(path, JSON.stringify(json.errors ?? json, null, 2));
    return null;
  }
  return json.result;
}

const scripts = await cf(`/accounts/${accountId}/workers/scripts`);
if (!scripts) process.exit(1);

let total = 0;
for (const s of scripts) {
  const name = s.id ?? s;
  const sched = await cf(`/accounts/${accountId}/workers/scripts/${name}/schedules`);
  const crons = sched?.schedules ?? [];
  if (crons.length) {
    console.log(`${name}: ${crons.map((c) => c.cron).join(", ")}`);
    total += crons.length;
  }
}
console.log(`\nTotal cron triggers: ${total}`);
