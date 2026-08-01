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

const base = process.argv[2] ?? env.CZ_WORKERS_DEV_BASE ?? "https://recenze-ceny.cz";
const secret = env.HOOK_SECRET;
const url = `${base}/api/public/hooks/pipeline-status?secret=${encodeURIComponent(secret)}`;
const res = await fetch(url);
const json = await res.json();
console.log(res.status, JSON.stringify(json, null, 2));
