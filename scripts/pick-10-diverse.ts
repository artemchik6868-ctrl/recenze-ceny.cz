/**
 * Pick 10 offers: max partner + category diversity.
 * Usage:
 *   npx tsx scripts/pick-10-diverse.ts
 *   npx tsx scripts/pick-10-diverse.ts --random --exclude=22597,8723
 *   npx tsx scripts/pick-10-diverse.ts --random --seed=42
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

const random = process.argv.includes("--random");
const seedArg = process.argv.find((a) => a.startsWith("--seed="))?.split("=")[1];
const seed = seedArg ? Number(seedArg) : Date.now();
const excludeIds = new Set(
  (process.argv.find((a) => a.startsWith("--exclude="))?.split("=")[1] ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(Boolean),
);

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const rand = random ? mulberry32(seed) : () => 0;

const SOURCES: OfferSource[] = random
  ? shuffle(
      ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes"] satisfies OfferSource[],
      rand,
    )
  : ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes"];

const PREFERRED_CATS = random
  ? shuffle(
      [
        "klouby",
        "prostata",
        "zrak",
        "domaci-klima",
        "masazni-pristroje",
        "zahrada",
        "krevni-tlak",
        "potence",
        "hracky",
        "obleceni",
        "lekarske-pristroje",
        "hubnuti",
        "domaci-vychytavky",
        "modni-doplnky",
        "paraziti",
      ],
      rand,
    )
  : [
      "klouby",
      "prostata",
      "zrak",
      "domaci-klima",
      "masazni-pristroje",
      "zahrada",
      "krevni-tlak",
      "potence",
      "hracky",
      "obleceni",
      "lekarske-pristroje",
      "hubnuti",
      "domaci-vychytavky",
      "modni-doplnky",
      "paraziti",
    ];

function poolFor(source: OfferSource, all: Offer[]): Offer[] {
  let pool = all.filter((o) => o.source === source && !excludeIds.has(o.id));
  if (random) pool = shuffle(pool, rand);
  return pool;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();

const picked: Offer[] = [];
const usedCats = new Set<string>();

function alreadyPicked(o: Offer): boolean {
  return picked.some((p) => p.id === o.id && p.source === o.source);
}

// Round 1: one per source, unique category
for (const source of SOURCES) {
  const pool = poolFor(source, offers);
  for (const cat of PREFERRED_CATS) {
    if (usedCats.has(cat)) continue;
    const o = pool.find((x) => x.categorySlug === cat);
    if (o) {
      picked.push(o);
      usedCats.add(cat);
      break;
    }
  }
}

// Round 2: fill to 10 with new category+source pairs
for (const source of SOURCES) {
  if (picked.length >= 10) break;
  const pool = poolFor(source, offers);
  for (const o of pool) {
    if (picked.length >= 10) break;
    if (alreadyPicked(o)) continue;
    if (usedCats.has(o.categorySlug)) continue;
    picked.push(o);
    usedCats.add(o.categorySlug);
    break;
  }
}

// Round 3: any remaining slots
for (const source of SOURCES) {
  if (picked.length >= 10) break;
  const pool = poolFor(source, offers);
  for (const o of pool) {
    if (picked.length >= 10) break;
    if (alreadyPicked(o)) continue;
    picked.push(o);
  }
}

if (random) {
  console.log(`=== pick mode: random (seed=${seed}, excluded=${excludeIds.size}) ===\n`);
}

console.log("=== 10 diverse test offers ===\n");
for (const o of picked) {
  console.log(`${o.source}:${o.id}\t${o.categorySlug}\t${o.title.slice(0, 60)}`);
}

console.log("\n=== By source (for test-ai-only) ===\n");
const bySource = new Map<OfferSource, number[]>();
for (const o of picked) {
  const arr = bySource.get(o.source) ?? [];
  arr.push(o.id);
  bySource.set(o.source, arr);
}
for (const [source, ids] of bySource) {
  console.log(`npx tsx scripts/test-ai-only.ts --source=${source} --offers=${ids.join(",")}`);
}

console.log("\n=== URLs ===\n");
for (const o of picked) {
  console.log(`https://recenze-ceny.cz/${o.categorySlug}/${o.slug}`);
}
