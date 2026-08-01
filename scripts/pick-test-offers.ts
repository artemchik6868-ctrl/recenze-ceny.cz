/**
 * Pick diverse offers per source for AI content testing.
 * Usage: npx tsx scripts/pick-test-offers.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Offer, OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const SOURCES: OfferSource[] = [
  "cpa_tl",
  "kma",
  "m1_top",
  "cpagetti",
  "adcombo",
  "shakes",
];

/** Categories we want coverage for (supplement + appliance + fashion). */
const TARGET_CATEGORIES = [
  "klouby",
  "prostata",
  "masazni-pristroje",
  "domaci-klima",
  "zahrada",
  "zrak",
  "krevni-tlak",
  "potence",
  "hracky",
  "obleceni",
  "lekarske-pristroje",
  "paraziti",
  "hubnuti",
  "domaci-vychytavky",
  "modni-doplnky",
];

const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();

function pickForSource(source: OfferSource, perSource = 3): Offer[] {
  const pool = offers.filter((o) => o.source === source);
  const picked: Offer[] = [];
  const used = new Set<string>();

  for (const cat of TARGET_CATEGORIES) {
    if (picked.length >= perSource) break;
    const o = pool.find((x) => x.categorySlug === cat);
    if (o && !used.has(String(o.id))) {
      picked.push(o);
      used.add(String(o.id));
    }
  }

  for (const o of pool) {
    if (picked.length >= perSource) break;
    if (used.has(String(o.id))) continue;
    picked.push(o);
    used.add(String(o.id));
  }

  return picked;
}

console.log("\n=== Diverse test matrix ===\n");

const allPicks: Array<{ source: OfferSource; id: number; cat: string; title: string }> = [];

for (const source of SOURCES) {
  const batch = pickForSource(source, 3);
  if (!batch.length) {
    console.log(`${source}: (no offers)\n`);
    continue;
  }
  console.log(`## ${source}`);
  for (const o of batch) {
    console.log(`  ${o.id}\t${o.categorySlug}\t${o.title.slice(0, 55)}`);
    allPicks.push({ source, id: o.id, cat: o.categorySlug, title: o.title });
  }
  console.log("");
}

console.log("=== Batch command (sequential) ===\n");
for (const source of SOURCES) {
  const ids = allPicks.filter((p) => p.source === source).map((p) => p.id);
  if (ids.length) console.log(`npx tsx scripts/test-ai-only.ts --source=${source} --offers=${ids.join(",")}`);
}

console.log("\n=== One-liner IDs ===");
console.log(
  allPicks.map((p) => `${p.source}:${p.id}(${p.cat})`).join(" | "),
);
