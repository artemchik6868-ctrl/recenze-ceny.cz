/**
 * Regen ticket offers from Partner Feed Pack V3.
 * Usage: npx tsx scripts/regen-ticket-v3.ts
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

const TICKET: Array<[OfferSource, number]> = [
  ["adcombo", 40543],
  ["adcombo", 39147],
  ["adcombo", 17959],
  ["adcombo", 11733],
  ["m1_top", 5179],
  ["m1_top", 5948],
  ["kma", 11330],
  ["cpagetti", 8983],
  ["cpagetti", 9329],
];

const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const offers = await loadOffers();

let ok = 0;
let fail = 0;
for (const [source, id] of TICKET) {
  const offer = offers.find((o) => o.source === source && o.id === id);
  if (!offer) {
    console.log(`SKIP missing ${source}:${id}`);
    fail += 1;
    continue;
  }
  const out = await getOrGenerateProductContent(source, id, "uk", offer.categorySlug, {
    forceRegen: true,
  });
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`OK   ${source}:${id} → ${offer.categorySlug} html=${out.description_html.length}`);
  } else {
    fail += 1;
    console.log(`FAIL ${source}:${id} tier=${out?.content_tier ?? "null"}`);
  }
}
console.log(`\nDone — ok=${ok} fail=${fail}`);
