/**
 * Audit product_content rows where display_title_uk brand was truncated by legacy geo-strip.
 *
 * Usage:
 *   npx tsx scripts/audit-truncated-brands.ts
 *   npx tsx scripts/audit-truncated-brands.ts --source=cpagetti
 *   npx tsx scripts/audit-truncated-brands.ts --ids-only
 *   npx tsx scripts/audit-truncated-brands.ts --out=scripts/.cache/truncated-brands-audit.json
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_OUT = resolve(ROOT, "scripts", ".cache", "truncated-brands-audit.json");

function loadEnv(): void {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    const key = m[1].trim();
    if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
  }
}

function parseArgs(argv: string[]): { source: OfferSource | null; out: string; idsOnly: boolean } {
  let source: OfferSource | null = null;
  let out = DEFAULT_OUT;
  let idsOnly = false;
  for (const raw of argv) {
    if (raw.startsWith("--source=")) source = raw.slice(9) as OfferSource;
    if (raw.startsWith("--out=")) out = resolve(ROOT, raw.slice(6));
    if (raw === "--ids-only") idsOnly = true;
  }
  return { source, out, idsOnly };
}

type TruncatedRow = {
  source: string;
  offer_id: number;
  slug: string;
  url: string;
  display_title_uk: string;
  expected_brand: string;
  actual_brand: string;
  reason: string;
  category_slug: string | null;
};

async function main(): Promise<void> {
  loadEnv();
  const { source, out, idsOnly } = parseArgs(process.argv.slice(2));

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }

  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
  const { truncatedBrandReason, splitBrandAndTail, resolveHeadlineBrand } = await import(
    "../src/lib/brand-clean"
  );
  const { loadOffers } = await import("../src/lib/offers.server");

  const offers = await loadOffers().catch(() => []);
  const offerByKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

  const truncated: TruncatedRow[] = [];
  let offset = 0;
  const pageSize = 500;

  while (true) {
    let q = supabaseAdmin
      .from("product_content")
      .select("source, offer_id, display_title_uk, title_uk, description_html_uk")
      .not("display_title_uk", "is", null)
      .range(offset, offset + pageSize - 1);
    if (source) q = q.eq("source", source);
    const { data, error } = await q;
    if (error) {
      console.error("query failed:", error.message);
      process.exit(1);
    }
    const rows = (data ?? []) as {
      source: string;
      offer_id: number;
      display_title_uk: string | null;
      title_uk: string | null;
      description_html_uk: string | null;
    }[];
    if (!rows.length) break;

    for (const row of rows) {
      const title = row.display_title_uk?.trim() ?? "";
      if (!title) continue;
      const key = `${row.source}:${row.offer_id}`;
      const offer = offerByKey.get(key);
      if (!offer) continue;

      const reason = truncatedBrandReason(title, offer.brand ?? "", offer.title, {
        titleUk: row.title_uk,
        html: row.description_html_uk,
      });
      if (!reason) continue;

      const { brand: actualBrand } = splitBrandAndTail(title);
      const expectedBrand = resolveHeadlineBrand(offer.brand ?? "", offer.title);
      const slug = offer.slug;
      const categorySlug = offer.categorySlug ?? null;
      const url = categorySlug
        ? `https://recenze-ceny.cz/${categorySlug}/${slug}`
        : `https://recenze-ceny.cz/other/${slug}`;

      truncated.push({
        source: row.source,
        offer_id: row.offer_id,
        slug,
        url,
        display_title_uk: title,
        expected_brand: expectedBrand,
        actual_brand: actualBrand,
        reason,
        category_slug: categorySlug,
      });
    }
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  const bySource: Record<string, number> = {};
  const byReason: Record<string, number> = {};
  for (const r of truncated) {
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
    byReason[r.reason] = (byReason[r.reason] ?? 0) + 1;
  }

  if (idsOnly) {
    for (const r of truncated) console.log(`${r.source}:${r.offer_id}`);
    return;
  }

  const report = {
    generated_at: new Date().toISOString(),
    source_filter: source,
    total_truncated: truncated.length,
    by_source: bySource,
    by_reason: byReason,
    rows: truncated,
  };

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2), "utf8");

  console.log(`Truncated brands: ${truncated.length}`);
  for (const [src, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${n}`);
  }
  for (const [reason, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${n}`);
  }
  console.log(`Written: ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
