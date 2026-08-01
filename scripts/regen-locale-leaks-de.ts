/**
 * Regenerate product_content rows with non-German locale leaks (PL/Cyrillic).
 *
 * Usage:
 *   npx tsx scripts/regen-locale-leaks-de.ts --dry-run
 *   npx tsx scripts/regen-locale-leaks-de.ts --limit=20
 *   npx tsx scripts/regen-locale-leaks-de.ts --only=cpa_tl:9878
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const pauseArg = process.argv.find((a) => a.startsWith("--pause-ms="));

const onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;
const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
const pauseMs = pauseArg ? Number(pauseArg.slice(11)) : 1500;

const { hasNonGermanProductContent, hasNonGermanLocaleLeak } = await import("../src/lib/locale-leak-de.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { offerDisplayTitle } = await import("../src/lib/offer-display.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);

const offers = await loadOffers();
const byKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

const { data: contentRows, error } = await supabaseAdmin
  .from("product_content")
  .select("source, offer_id, display_title_uk, description_html_uk, faq_uk");

if (error) {
  console.error("regen-locale-leaks-de: DB error", error.message);
  process.exit(1);
}

const leakingKeys: string[] = [];
for (const row of contentRows ?? []) {
  const key = `${row.source}:${row.offer_id}`;
  const dto = {
    display_title: row.display_title_uk,
    description_html: row.description_html_uk,
    faq: row.faq_uk,
  };
  if (hasNonGermanProductContent(dto)) leakingKeys.push(key);
}

const catalogOnlyLeaks: string[] = [];
for (const o of offers) {
  const key = `${o.source}:${o.id}`;
  if (leakingKeys.includes(key)) continue;
  const title = offerDisplayTitle(o);
  if (hasNonGermanLocaleLeak(title) || hasNonGermanLocaleLeak(o.title)) {
    catalogOnlyLeaks.push(key);
  }
}

let targetKeys = onlyKeys
  ? leakingKeys.filter((k) => onlyKeys.has(k))
  : leakingKeys;

targetKeys = targetKeys.sort();
if (Number.isFinite(limit)) targetKeys = targetKeys.slice(0, limit);

console.log(
  `\n=== regen-locale-leaks-de — ${targetKeys.length}/${leakingKeys.length} DB leaking rows, ${catalogOnlyLeaks.length} catalog-only (dry=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);
if (catalogOnlyLeaks.length) {
  console.log(`Catalog-only (runtime H1 fix applies, no DB regen): ${catalogOnlyLeaks.slice(0, 10).join(", ")}${catalogOnlyLeaks.length > 10 ? "…" : ""}\n`);
}

let ok = 0;
let skip = 0;
let fail = 0;

for (const key of targetKeys) {
  const offer = byKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    skip += 1;
    continue;
  }
  const row = (contentRows ?? []).find((r) => `${r.source}:${r.offer_id}` === key);
  console.log(`REGEN ${key} (${offer.categorySlug})`);
  console.log(`  feed: ${offer.title.slice(0, 60)}`);
  console.log(`  was:  ${String(row?.display_title_uk ?? "").slice(0, 70)}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const [source, idStr] = key.split(":");
  try {
    const out = await getOrGenerateProductContent(
      source as OfferSource,
      Number(idStr),
      "uk",
      offer.categorySlug,
      { forceRegen: true },
    );
    if (out && !hasNonGermanProductContent(out) && out.description_html && out.description_html.length >= 400) {
      ok += 1;
      console.log(`  OK   display=${out.display_title?.slice(0, 70)} html=${out.description_html.length}`);
    } else if (out?.description_html && out.description_html.length >= 400) {
      fail += 1;
      console.log(`  FAIL still leaking display=${out.display_title?.slice(0, 70)}`);
    } else {
      fail += 1;
      console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
    }
  } catch (err) {
    fail += 1;
    console.log(`  FAIL ${String(err).slice(0, 120)}`);
  }
  if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
}

console.log(`\nDone — ok=${ok} skip=${skip} fail=${fail}`);
