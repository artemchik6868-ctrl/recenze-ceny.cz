/**
 * Regen offers flagged by audit (cyrillic-leak, placeholder, failed, short html).
 * Usage: npx tsx scripts/regen-audit-targets.ts
 */
import { execSync } from "node:child_process";
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

const raw = execSync("node scripts/audit-content.mjs --ids-only", {
  cwd: root,
  encoding: "utf8",
});
const ids = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#") && /^[\w_]+:\d+$/.test(l));

console.log(`\n=== regen audit targets — ${ids.length} offers ===\n`);

const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { loadOffers } = await import("../src/lib/offers.server.ts");

const offers = await loadOffers();
let ok = 0;
let fail = 0;

for (const key of ids) {
  const [source, idStr] = key.split(":");
  const offerId = Number(idStr);
  const offer = offers.find((o) => o.id === offerId && o.source === source);
  if (!offer) {
    console.log(`SKIP ${key} — offer not found`);
    fail += 1;
    continue;
  }
  console.log(`--- regen ${source}:${offerId} (${offer.categorySlug}) ---`);
  const out = await getOrGenerateProductContent(source, offerId, "uk", offer.categorySlug, {
    forceRegen: true,
  });
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK html=${out.description_html.length} tier=${out.content_tier}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone ${PIPELINE_VERSION} — ok=${ok} fail=${fail}`);
