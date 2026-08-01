/**
 * Final pass: Pest Reject, Venzen, Rhino, Gigant, Benaga titles + content.
 * Usage: npx tsx scripts/regen-venzen-pest.ts
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

const JOBS: Array<[OfferSource, number, string]> = [
  ["adcombo", 17979, "zahradni-naradi"],
  ["cpa_tl", 13485, "anti-aging"],
  ["cpa_tl", 11778, "anti-aging"],
  ["cpa_tl", 8787, "anti-aging"],
  ["adcombo", 5902, "kosmeticke-nastroje"],
  ["shakes", 4191, "zvetseni-penisu"],
  ["shakes", 19990, "stres"],
];

const { persistResolvedCategorySlug } = await import("../src/lib/catalog-shelf.server.ts");
const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");

for (const [src, id, slug] of JOBS) {
  await persistResolvedCategorySlug(src, id, slug);
  const out = await getOrGenerateProductContent(src, id, "uk", slug, { forceRegen: true });
  console.log(`${src}:${id}`, out?.display_title ?? "FAIL");
}
