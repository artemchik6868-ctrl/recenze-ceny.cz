/**
 * Regen offers with product-role / shelf descriptor mismatches.
 *
 * Usage:
 *   npx tsx scripts/regen-role-mismatches.ts --dry-run
 *   npx tsx scripts/regen-role-mismatches.ts
 *   npx tsx scripts/regen-role-mismatches.ts --only=cpa_tl:21782
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SHELF_OVERRIDES } from "../src/lib/catalog-shelf-overrides";
import { inferProductRoleIt } from "../src/lib/product-role.it";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;

/** Legacy shelf-biased phrases baked into old display titles. */
const STALE_DISPLAY_MARKERS = [
  /occhiali da guida/i,
  /abbigliamento modellante/i,
  /giocattolo radiocomandato/i,
  /accessorio per la guida/i,
];

const TITLE_CONFLICT = [
  /\b(?:amulet|amuleto|talisman|fehu|money\s+amulet)\b/i,
  /\b(?:cushion|cuscino|pillow)\b/i,
  /\b(?:headphone|earbud|cuffie)\b/i,
  /\b(?:shower\s*head|soffione)\b/i,
  /\b(?:leggings|waist\s+trainer)\b/i,
  /\b(?:motion\s+mat|lamzac|inflatable)\b/i,
  /\b(?:glass\s+coating|vetro\s+liquido)\b/i,
];

function isRoleMismatch(
  feedTitle: string,
  displayTitle: string | null | undefined,
): boolean {
  const disp = displayTitle?.trim() ?? "";
  if (!disp) return false;
  const hay = `${feedTitle} ${disp}`;
  const inferred = inferProductRoleIt(feedTitle);
  if (!inferred) return false;
  const inferredNorm = inferred.toLowerCase();
  const dispNorm = disp.toLowerCase();
  if (dispNorm.includes(inferredNorm.split(" ")[0]!)) return false;
  const stale = STALE_DISPLAY_MARKERS.some((re) => re.test(disp));
  const titleConflict = TITLE_CONFLICT.some((re) => re.test(feedTitle));
  return stale && titleConflict;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);

const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

const { data: contentRows } = await supabaseAdmin
  .from("product_content")
  .select("source, offer_id, display_title_uk");
const displayByKey = new Map<string, string | null>();
for (const r of (contentRows ?? []) as {
  source: string;
  offer_id: number;
  display_title_uk: string | null;
}[]) {
  displayByKey.set(`${r.source}:${r.offer_id}`, r.display_title_uk);
}

const keys = new Set<string>(Object.keys(SHELF_OVERRIDES));

for (const o of offers) {
  const key = `${o.source}:${o.id}`;
  const disp = displayByKey.get(key);
  if (isRoleMismatch(o.title, disp)) keys.add(key);
}

const targetKeys = onlyKeys
  ? [...keys].filter((k) => onlyKeys.has(k))
  : [...keys];

console.log(
  `\n=== regen-role-mismatches — ${targetKeys.length} offers (dry=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);

let ok = 0;
let skip = 0;
let fail = 0;

for (const key of targetKeys.sort()) {
  const offer = byKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    skip += 1;
    continue;
  }
  const disp = displayByKey.get(key) ?? "";
  console.log(`REGEN ${key} (${offer.categorySlug})`);
  console.log(`  feed: ${offer.title.slice(0, 60)}`);
  console.log(`  was:  ${disp.slice(0, 70)}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = key.split(":");
  const out = await getOrGenerateProductContent(
    source as OfferSource,
    Number(idStr),
    "uk",
    offer.categorySlug,
    { forceRegen: true },
  );
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK   display=${out.display_title?.slice(0, 70)} html=${out.description_html.length}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone — ok=${ok} skip=${skip} fail=${fail}`);
