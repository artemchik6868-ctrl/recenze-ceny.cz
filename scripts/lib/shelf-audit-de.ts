/** Shared DE shelf audit helpers for operational scripts. */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyTitleFirst } from "../../src/lib/classify";
import { resolveIntentListingSlug } from "../../src/lib/catalog-shelf";
import { buildPartnerClassifyBlob } from "../../src/lib/partner-feed-text";
import { inferProductIntentSlug } from "../../src/lib/product-intent.de";
import type { Offer, OfferSource } from "../../src/lib/types";

export const SOURCE_TABLE: Record<OfferSource, string> = {
  cpa_tl: "cpa_tl_offers",
  kma: "kma_offers",
  m1_top: "m1_offers",
  cpagetti: "cpagetti_offers",
  adcombo: "adcombo_offers",
  shakes: "shakes_offers",

};

const CONFLICTING_CUE_RE =
  /hemoroid|papilom|borodav|sluh|hearing|alkohol|alcohol|abnehmen|gewicht|weight\s*loss|shuj[šs]|huj[šs]|kajenj|smoking|odvisnost/i;

const TRUE_RESPIRATORY_RE = /deep\s*inhale|pljuč|pljučnik|\blung\s*tea\b|dihal|ateemwege|atemwege/i;

export function loadEnvFromDotenv(): string {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1].trim()] = v;
  }
  return root;
}

export async function loadPartnerRaw(
  source: OfferSource,
  offerId: number,
): Promise<unknown> {
  const { supabaseAdmin } = await import("../../src/integrations/supabase/client.server.ts");
  const { data } = await supabaseAdmin
    .from(SOURCE_TABLE[source])
    .select("raw")
    .eq("offer_id", offerId)
    .maybeSingle();
  return (data as { raw?: unknown } | null)?.raw ?? null;
}

export function shakesLandingTitles(raw: unknown): string {
  const landingsRaw = (raw as { landings?: unknown })?.landings;
  const landings = Array.isArray(landingsRaw)
    ? landingsRaw
    : landingsRaw && typeof landingsRaw === "object"
      ? Object.values(landingsRaw as Record<string, { title?: string }>)
      : [];
  return landings
    .map((l) => String((l as { title?: string })?.title ?? "").trim())
    .filter(Boolean)
    .join(" | ");
}

export type ShelfAuditRow = {
  key: string;
  source: OfferSource;
  id: number;
  url: string;
  rawTitle: string;
  brand: string;
  blob: string;
  landings: string;
  syncSlug: string;
  intentSlug: string | null;
  expectedSlug: string;
  listingSlug: string;
  currentListingSlug: string;
  resolvedSlug: string | null;
  displayTitle: string | null;
  flags: string[];
};

export function computeShelfAuditRow(
  o: Offer,
  raw: unknown,
  resolvedSlug: string | null | undefined,
): ShelfAuditRow {
  const rawTitle = o.title || o.brand || "";
  const feedKey = o.categoryKey || o.categoryName || "";
  const blob = raw
    ? buildPartnerClassifyBlob(o.source, raw, rawTitle, feedKey)
    : o.feedClassifyText || feedKey;
  const syncSlug = classifyTitleFirst(rawTitle, blob, "other");
  const intentSlug = inferProductIntentSlug(rawTitle, o.brand, blob);
  const expectedSlug = classifyTitleFirst(rawTitle, blob, "other");
  const listingSlug = resolveIntentListingSlug({
    source: o.source,
    offerId: o.id,
    syncSlug,
    resolvedSlug,
    rawTitle,
    brand: o.brand,
    feedText: blob,
  });

  const flags: string[] = [];
  if (expectedSlug !== "other" && expectedSlug !== o.categorySlug) {
    flags.push("EXPECTED_MISMATCH");
  }
  if (listingSlug !== o.categorySlug) {
    flags.push("LISTING_RECOMPUTE");
  }
  if (o.categorySlug === "dychaci-cesty" && expectedSlug !== "dychaci-cesty") {
    flags.push("RESPIRATORY_TRAP");
  }
  if (expectedSlug === "other" && !blob.trim()) {
    flags.push("NEEDS_LANDING_REVIEW");
  }
  if (
    o.categorySlug === "dychaci-cesty" &&
    expectedSlug === "dychaci-cesty" &&
    CONFLICTING_CUE_RE.test(blob)
  ) {
    flags.push("RESPIRATORY_WITH_CONFLICT_CUE");
  }
  if (
    expectedSlug === "dychaci-cesty" ||
    (TRUE_RESPIRATORY_RE.test(blob) && !CONFLICTING_CUE_RE.test(blob))
  ) {
    flags.push("TRUE_RESPIRATORY");
  }

  return {
    key: `${o.source}:${o.id}`,
    source: o.source,
    id: o.id,
    url: `https://recenze-ceny.cz/${o.categorySlug}/${o.slug}`,
    rawTitle,
    brand: o.brand,
    blob: blob.slice(0, 200),
    landings: shakesLandingTitles(raw).slice(0, 200),
    syncSlug,
    intentSlug,
    expectedSlug,
    listingSlug,
    currentListingSlug: o.categorySlug,
    resolvedSlug: resolvedSlug ?? null,
    displayTitle: o.displayTitle ?? null,
    flags,
  };
}

export function remediateTargetSlug(row: ShelfAuditRow): string | null {
  if (row.currentListingSlug !== "dychaci-cesty") return null;
  if (row.flags.includes("NEEDS_LANDING_REVIEW")) return null;

  if (row.intentSlug && row.intentSlug !== "other" && row.intentSlug !== "dychaci-cesty") {
    return row.intentSlug;
  }
  if (row.listingSlug !== "dychaci-cesty" && row.listingSlug !== "other") {
    return row.listingSlug;
  }
  if (row.expectedSlug === "dychaci-cesty") {
    if (row.flags.includes("RESPIRATORY_WITH_CONFLICT_CUE")) {
      return row.listingSlug !== "dychaci-cesty" ? row.listingSlug : null;
    }
    return null;
  }
  if (row.expectedSlug !== "other") return row.expectedSlug;
  return null;
}
