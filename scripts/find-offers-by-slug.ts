import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const needles = [
  "venzen",
  "vermixin",
  "cleorix",
  "gigant",
  "rhino",
  "benaga-s19990",
  "benaga-s19056",
  "pest",
  "knee",
  "sadoer",
  "fvo",
  "curling",
  "ledmask",
];
const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();
for (const n of needles) {
  for (const o of offers) {
    const slug = o.slug ?? "";
    if (slug.includes(n) || (o.title ?? "").toLowerCase().includes(n)) {
      console.log(`${o.source}:${o.id}`, o.categorySlug, slug, (o.title ?? "").slice(0, 55));
    }
  }
}
