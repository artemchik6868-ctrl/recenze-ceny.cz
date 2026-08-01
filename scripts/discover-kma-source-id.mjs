/**
 * List KMA traffic sources for the configured API key.
 * Usage: node scripts/discover-kma-source-id.mjs
 * Then set KMA_SOURCE_ID in .env and run: node scripts/push-cloudflare-secrets.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const token = env.KMA_API_KEY;
if (!token) {
  console.error("KMA_API_KEY missing in .env");
  process.exit(1);
}

const methods = ["getsources", "get_sources", "getsource", "get_sources_list"];
for (const method of methods) {
  const url = `https://api.kma.biz/?method=${method}&token=${encodeURIComponent(token)}&return_type=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();
  console.log(`\n=== ${method} (HTTP ${res.status}) ===`);
  console.log(JSON.stringify(json, null, 2).slice(0, 4000));
}

if (env.KMA_SOURCE_ID) {
  console.log(`\n.env already has KMA_SOURCE_ID=${env.KMA_SOURCE_ID}`);
}
