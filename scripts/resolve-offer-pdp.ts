import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  const key = m[1].trim();
  if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
}

const want = new Set([
  "shakes:14211",
  "m1_top:3896",
  "shakes:4201",
  "m1_top:4823",
  "m1_top:3261",
]);

const { loadOffers } = await import(
  pathToFileURL(resolve(root, "src/lib/offers.server.ts")).href
);
for (const o of await loadOffers()) {
  const key = `${o.source}:${o.id}`;
  if (!want.has(key)) continue;
  console.log(`${key}\t${o.displayTitle || o.title}\thttps://recenze-ceny.cz/${o.categorySlug}/${o.slug}`);
}
