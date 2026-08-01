/**
 * Rescue offers stuck in catch-all `other` (or stale resolved) using landing tokens + H1 role.
 *
 * Usage:
 *   npx tsx scripts/rescue-other-offers.ts --dry-run
 *   npx tsx scripts/rescue-other-offers.ts --persist
 *   npx tsx scripts/rescue-other-offers.ts --persist --regen-only
 */
import {
  computeShelfAuditRow,
  loadEnvFromDotenv,
  loadPartnerRaw,
} from "./lib/shelf-audit-de";
import { resolveIntentListingSlug } from "../src/lib/catalog-shelf";
import { classifyTitleFirst } from "../src/lib/classify";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
import { loadResolvedCategoryMap, persistResolvedCategorySlug } from "../src/lib/catalog-shelf.server";
import type { Offer, OfferSource } from "../src/lib/types";

loadEnvFromDotenv();

const dryRun = process.argv.includes("--dry-run") || (!process.argv.includes("--persist") && !process.argv.includes("--regen-only"));
const regenOnly = process.argv.includes("--regen-only");
const regenAfter = process.argv.includes("--regen") || regenOnly;
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const filterSource = sourceArg ? (sourceArg.slice(9) as OfferSource) : null;

function targetListing(o: Offer, resolvedSlug: string | null | undefined, blob: string): string {
  const role = o.displayTitle?.includes("—")
    ? o.displayTitle.split(/\s*[—–-]\s*/).slice(1).join(" ").trim()
    : undefined;
  const syncSlug = classifyTitleFirst(o.title, blob, "other");
  return resolveIntentListingSlug({
    source: o.source,
    offerId: o.id,
    syncSlug,
    resolvedSlug,
    rawTitle: o.title,
    brand: o.brand,
    productRole: role,
    displayH1: o.displayTitle ?? undefined,
    feedText: blob,
  });
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");
const offers = await loadOffers();
const resolvedMap = await loadResolvedCategoryMap();

let candidates = offers.filter((o) => {
  const key = `${o.source}:${o.id}`;
  const resolved = resolvedMap.get(key);
  if (o.categorySlug === "other" || resolved === "other") return true;
  if (resolved && resolved !== o.categorySlug) return true;
  return false;
});
if (filterSource) candidates = candidates.filter((o) => o.source === filterSource);

if (regenOnly) {
  candidates = offers.filter(
    (o) =>
      o.categorySlug !== "other" &&
      /atemwege|unterstützungsmittel|verdauungsmittel/i.test(o.displayTitle ?? "") &&
      o.source === "shakes",
  );
}

console.log(`\n=== rescue-other-offers — ${candidates.length} offers (dryRun=${dryRun}) ===\n`);

const regenTargets: Array<{ source: OfferSource; id: number; slug: string }> = [];
let move = 0;
let skip = 0;

for (const o of candidates) {
  const raw = await loadPartnerRaw(o.source, o.id);
  const blob = raw
    ? buildPartnerClassifyBlob(o.source, raw, o.title, o.categoryKey || o.categoryName || "")
    : o.feedClassifyText || "";
  const target = targetListing(o, resolvedMap.get(`${o.source}:${o.id}`), blob);

  if (regenOnly) {
    regenTargets.push({ source: o.source, id: o.id, slug: o.categorySlug });
    continue;
  }

  if (target === "other") {
    skip += 1;
    continue;
  }

  if (target === o.categorySlug && resolvedMap.get(`${o.source}:${o.id}`) === target) {
    skip += 1;
    continue;
  }

  move += 1;
  const line = `${o.source}:${o.id}  ${o.categorySlug} → ${target}  «${o.title.slice(0, 40)}»`;
  regenTargets.push({ source: o.source, id: o.id, slug: target });

  if (dryRun) {
    console.log(`DRY  ${line}`);
    continue;
  }
  const saved = await persistResolvedCategorySlug(o.source, o.id, target);
  console.log(saved ? `OK   ${line}` : `FAIL ${line}`);
}

console.log(`\nDone — move=${move} skip=${skip} dryRun=${dryRun}`);

if (regenAfter && !dryRun && regenTargets.length > 0) {
  console.log(`\n=== regen — ${regenTargets.length} offers ===\n`);
  let ok = 0;
  let fail = 0;
  for (const t of regenTargets) {
    const out = await getOrGenerateProductContent(t.source, t.id, "uk", t.slug, { forceRegen: true });
    if (out?.description_html && out.description_html.length >= 400) {
      ok += 1;
      console.log(`OK   ${t.source}:${t.id} → ${t.slug} display=${out.display_title?.slice(0, 70)}`);
    } else {
      fail += 1;
      console.log(`FAIL ${t.source}:${t.id}`);
    }
  }
  console.log(`\nRegen done — ok=${ok} fail=${fail}`);
}
