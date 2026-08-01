/**
 * Persist intent-based listing shelf for known mismatched SKUs.
 * Usage: npx tsx scripts/fix-intent-shelf.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const TARGETS: Array<{ source: OfferSource; id: number; slug: string }> = [
  { source: "kma", id: 10640, slug: "paraziti" },
  { source: "kma", id: 10641, slug: "paraziti" },
  { source: "cpagetti", id: 17009, slug: "klouby" },
  { source: "kma", id: 10147, slug: "paraziti" },
  { source: "kma", id: 11614, slug: "stres" },
  { source: "cpagetti", id: 14937, slug: "plisen-nehtu" },
  { source: "kma", id: 6180, slug: "ledviny" },
  { source: "kma", id: 6698, slug: "dychaci-cesty" },
  { source: "kma", id: 8038, slug: "dychaci-cesty" },
  { source: "adcombo", id: 34905, slug: "imunita" },
];

const { persistResolvedCategorySlug } = await import("../src/lib/catalog-shelf.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");

for (const t of TARGETS) {
  const slug = await persistResolvedCategorySlug(t.source, t.id, t.slug);
  console.log(`${t.source}:${t.id} → ${slug ?? "FAILED"} (expected ${t.slug})`);
}

const offers = await loadOffers();
for (const t of TARGETS) {
  const o = offers.find((x) => x.source === t.source && x.id === t.id);
  const ok = o?.categorySlug === t.slug;
  console.log(`${ok ? "OK" : "FAIL"} listing ${t.source}:${t.id} categorySlug=${o?.categorySlug ?? "missing"}`);
}
