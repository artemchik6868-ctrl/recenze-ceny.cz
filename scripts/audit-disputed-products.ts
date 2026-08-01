/**
 * Audit disputed SKUs + regen-brand-families cohort for shelf/role/descriptor alignment.
 *
 * Usage:
 *   npx tsx scripts/audit-disputed-products.ts
 *   npx tsx scripts/audit-disputed-products.ts --only-disputed
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  computeShelfAuditRow,
  loadEnvFromDotenv,
  loadPartnerRaw,
} from "./lib/shelf-audit-de";
import { loadResolvedCategoryMap } from "../src/lib/catalog-shelf.server";
import { inferProductRoleDe } from "../src/lib/product-role.de";
import {
  problemRoleForShelf,
  roleMatchesShelf,
  resolveProductPreRole,
} from "../src/lib/problem-vocabulary.de";
import {
  hasNonGermanProductContent,
  hasNonGermanLocaleLeak,
  productContentBlob,
} from "../src/lib/locale-leak-de";
import type { Offer } from "../src/lib/types";

const root = loadEnvFromDotenv();
const onlyDisputed = process.argv.includes("--only-disputed");

/** Original 17 disputed URL paths (slug only). */
const DISPUTED_SLUGS = new Set([
  "cordyceps-s19308",
  "reishield-s21086",
  "reishield-s21094",
  "cordyceps-s21980",
  "cordyceps-s19794",
  "reishield-s21654",
  "benaga-s19776",
  "benaga-s19800",
  "benaga-s19806",
  "hondro-a39152",
  "reishield-s21976",
  "benaga-s19174",
  "benaga-s19192",
  "reishield-s21928",
  "reishield-s21940",
  "reishield-s21948",
  "verdexedil-a39737",
  "rhino-a28586",
  "bae-13320",
  "bae-12616",
]);

const BRAND_FAMILY_RE =
  /\b(?:cordyceps|reishield|benaga|hondro\s*g|hondro\s*m|verdexedil|rhino|bae)\b/i;

const PROBLEM_SLUGS = new Set([
  "intimate-comfort",
  "sluch",
  "alkoholismus",
  "papilomy",
  "zrak",
  "hubnuti",
  "vboceny-palec",
  "vypadavani-vlasu",
  "zvetseni-penisu",
  "odvykani-koureni",
]);

const CLOTHING_ON_SHOES_RE = /\bbae\b|leggings|kleidung|clothing|dress|hoodie|poncho/i;

const BODY_CONFLICT: Partial<Record<string, { must?: RegExp; mustNot?: RegExp }>> = {
  sluch: { must: /gehör|gehor|hör|ohren|tinnitus|sluh/i, mustNot: /\b(?:aug(?:en)?|sehverm|atemweg|lunge)\b/i },
  "zrak": { must: /aug(?:en)?|sehverm|vision|lutein/i, mustNot: /gewichtskontrolle|abnehmen|atemweg/i },
  "intimate-comfort": { must: /hämorrhoid|hemoroid/i, mustNot: /atemweg|lunge|bronch/i },
  alkoholismus: { must: /alkohol|alcohol|entwöhnung/i, mustNot: /atemweg|lunge|bronch/i },
  papilomy: { must: /papillom|warzen|hpv/i, mustNot: /atemweg|lunge/i },
  "vboceny-palec": { must: /valgus|hallux|spray/i, mustNot: /einlage|silikon.*schiene/i },
  "vypadavani-vlasu": { must: /haar|spray/i, mustNot: /nahrungsergänzungsmittel.*kapseln/i },
  "zvetseni-penisu": { must: /penis|vergrößer|vergroess|gel|männlich/i, mustNot: /männer-ergänzungsmittel|nahrungsergänzung.*kapseln/i },
  obleceni: { must: /kleid|leggings|bekleid|dress|poncho/i, mustNot: /\bschuh/i },
};

function h1Tail(title: string | null | undefined): string {
  const t = title?.trim() ?? "";
  const parts = t.split(/\s*[—–-]\s*/);
  return parts.length > 1 ? parts.slice(1).join(" ").trim() : t;
}

const ROLE_KEYWORD_STOP = new Set([
  "kapseln", "für", "das", "die", "der", "zur", "zum", "bei", "gegen", "mittel", "gel", "spray",
  "creme", "tabletten", "tropfen", "unterstützung", "nahrungsergänzungsmittel",
]);

function roleOk(categorySlug: string, expectedRole: string | null, displayTitle: string | null | undefined): boolean {
  if (!expectedRole?.trim()) return true;
  const tail = h1Tail(displayTitle);
  if (roleMatchesShelf(tail, categorySlug)) return true;
  const tailLower = tail.toLowerCase();
  const keywords = (expectedRole.match(/[A-Za-zäöüÄÖÜß]{4,}/g) ?? []).filter(
    (kw) => !ROLE_KEYWORD_STOP.has(kw.toLowerCase()),
  );
  return keywords.some((kw) => tailLower.includes(kw.toLowerCase()));
}

function bodyMismatch(slug: string, html: string | null | undefined): boolean {
  const rules = BODY_CONFLICT[slug];
  if (!rules || !html?.trim()) return false;
  const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
  if (rules.mustNot?.test(text)) return true;
  if (rules.must && !rules.must.test(text)) return true;
  return false;
}

function inCohort(o: Offer): boolean {
  if (DISPUTED_SLUGS.has(o.slug)) return true;
  const hay = `${o.brand ?? ""} ${o.title}`.toLowerCase();
  if (BRAND_FAMILY_RE.test(hay)) return true;
  if (PROBLEM_SLUGS.has(o.categorySlug)) return true;
  if (o.categorySlug === "boty" && CLOTHING_ON_SHOES_RE.test(hay)) return true;
  return false;
}

type AuditRow = {
  key: string;
  url: string;
  disputed: boolean;
  currentSlug: string;
  expectedSlug: string;
  listingSlug: string;
  expectedRole: string | null;
  inferredRole: string | null;
  resolvedPreRole: string | null;
  displayTitle: string | null;
  metaDesc: string | null;
  categoryName: string | null;
  flags: string[];
};

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const offers = (await loadOffers()).filter(inCohort);
const filtered = onlyDisputed ? offers.filter((o) => DISPUTED_SLUGS.has(o.slug)) : offers;
const resolvedMap = await loadResolvedCategoryMap();

const contentByKey = new Map<string, Record<string, unknown>>();
for (const source of ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes"] as const) {
  const { data } = await supabaseAdmin
    .from("product_content")
    .select(
      "source, offer_id, display_title_uk, meta_desc_uk, subtitle_uk, description_html_uk, faq_uk, form_kind",
    )
    .eq("source", source);
  for (const row of data ?? []) {
    contentByKey.set(`${row.source}:${row.offer_id}`, row as Record<string, unknown>);
  }
}

const rows: AuditRow[] = [];

for (const o of filtered) {
  const key = `${o.source}:${o.id}`;
  const raw = await loadPartnerRaw(o.source, o.id);
  const shelf = computeShelfAuditRow(o, raw, resolvedMap.get(key));
  const content = contentByKey.get(key);
  const blob = shelf.blob;
  const inferredRole = inferProductRoleDe(o.title, o.brand, blob);
  const expectedRole = problemRoleForShelf(o.categorySlug, null, o.formKind);
  const resolvedPreRole = resolveProductPreRole(inferProductRoleDe, {
    rawTitle: o.title,
    brand: o.brand,
    feedSnippet: blob,
    categorySlug: o.categorySlug,
    formKind: o.formKind,
  });

  const displayTitle = (content?.display_title_uk as string | null) ?? o.displayTitle ?? null;
  const metaDesc = (content?.meta_desc_uk as string | null) ?? null;
  const html = (content?.description_html_uk as string | null) ?? null;
  const faq = content?.faq_uk;
  const localeBlob = productContentBlob({
    display_title: displayTitle,
    meta_desc: metaDesc,
    subtitle: content?.subtitle_uk as string | undefined,
    description_html: html,
    faq: faq as { q: string; a: string }[] | undefined,
  });

  const flags: string[] = [];
  if (shelf.currentListingSlug === shelf.expectedSlug || shelf.listingSlug === shelf.currentListingSlug) {
    flags.push("SHELF_OK");
  } else if (shelf.flags.includes("EXPECTED_MISMATCH") || shelf.flags.includes("LISTING_RECOMPUTE")) {
    flags.push("SHELF_MISMATCH");
  } else {
    flags.push("SHELF_OK");
  }

  const expRole = problemRoleForShelf(o.categorySlug, null, (content?.form_kind as string) ?? o.formKind);
  if (roleOk(o.categorySlug, expRole, displayTitle)) flags.push("ROLE_OK");
  else flags.push("ROLE_MISMATCH");

  if (
    inferredRole &&
    resolvedPreRole &&
    inferredRole !== resolvedPreRole &&
    shelf.expectedSlug === shelf.currentListingSlug
  ) {
    flags.push("ROLE_INFER_BUG");
  }

  if (bodyMismatch(o.categorySlug, html)) flags.push("BODY_MISMATCH");

  if (hasNonGermanProductContent({ display_title: displayTitle, description_html: html, faq: faq as never }) ||
    hasNonGermanLocaleLeak(localeBlob) ||
    /\bOd\s+\d/i.test(localeBlob)) {
    flags.push("LOCALE_LEAK");
  }

  if (o.categoryName === "Horen" || /Horvermogen|Unterstutzung/i.test(o.categoryName ?? "")) {
    flags.push("CATEGORY_NAME");
  }

  rows.push({
    key,
    url: shelf.url,
    disputed: DISPUTED_SLUGS.has(o.slug),
    currentSlug: shelf.currentListingSlug,
    expectedSlug: shelf.expectedSlug,
    listingSlug: shelf.listingSlug,
    expectedRole: expRole,
    inferredRole,
    resolvedPreRole,
    displayTitle,
    metaDesc,
    categoryName: o.categoryName ?? null,
    flags,
  });
}

const summary = {
  total: rows.length,
  disputed: rows.filter((r) => r.disputed).length,
  shelfOk: rows.filter((r) => r.flags.includes("SHELF_OK")).length,
  roleOk: rows.filter((r) => r.flags.includes("ROLE_OK")).length,
  roleInferBug: rows.filter((r) => r.flags.includes("ROLE_INFER_BUG")).length,
  bodyMismatch: rows.filter((r) => r.flags.includes("BODY_MISMATCH")).length,
  localeLeak: rows.filter((r) => r.flags.includes("LOCALE_LEAK")).length,
  categoryName: rows.filter((r) => r.flags.includes("CATEGORY_NAME")).length,
  failKeys: rows
    .filter((r) => r.flags.some((f) => f.endsWith("_MISMATCH") || f === "ROLE_INFER_BUG" || f === "LOCALE_LEAK"))
    .map((r) => r.key),
};

console.log("\n=== audit-disputed-products ===\n");
console.log(JSON.stringify(summary, null, 2));

console.log("\n--- disputed fails ---");
for (const r of rows.filter((x) => x.disputed && !x.flags.includes("ROLE_OK"))) {
  console.log(`${r.key} | ${r.flags.join("|")} | H1: ${h1Tail(r.displayTitle).slice(0, 55)} | exp: ${r.expectedRole}`);
}

const stamp = new Date().toISOString().slice(0, 10);
const outDir = resolve(root, "scripts", ".cache");
mkdirSync(outDir, { recursive: true });
const jsonPath = resolve(outDir, `audit-disputed-${stamp}.json`);
writeFileSync(jsonPath, JSON.stringify({ summary, rows }, null, 2), "utf8");

const csvLines = [
  "key,url,disputed,currentSlug,expectedSlug,expectedRole,inferredRole,resolvedPreRole,displayTitle,flags",
  ...rows.map((r) =>
    [
      r.key,
      r.url,
      r.disputed,
      r.currentSlug,
      r.expectedSlug,
      `"${(r.expectedRole ?? "").replace(/"/g, '""')}"`,
      `"${(r.inferredRole ?? "").replace(/"/g, '""')}"`,
      `"${(r.resolvedPreRole ?? "").replace(/"/g, '""')}"`,
      `"${(r.displayTitle ?? "").replace(/"/g, '""')}"`,
      r.flags.join("|"),
    ].join(","),
  ),
];
const csvPath = resolve(outDir, `audit-disputed-${stamp}.csv`);
writeFileSync(csvPath, csvLines.join("\n"), "utf8");
console.log(`\nWrote ${jsonPath}`);
console.log(`Wrote ${csvPath}`);

if (summary.failKeys.length) {
  console.log(`\nRe-regen hint:\nnpx tsx scripts/regen-brand-families.ts --force-regen --only=${summary.failKeys.slice(0, 40).join(",")}`);
}
