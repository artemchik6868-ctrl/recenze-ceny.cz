/**
 * Audit display_title_uk rows that need titles-only refresh (garbled CPA tails, English leaks).
 *
 * Usage:
 *   npx tsx scripts/audit-garbled-titles.ts
 *   npx tsx scripts/audit-garbled-titles.ts --source=cpagetti
 *   npx tsx scripts/audit-garbled-titles.ts --out=scripts/.cache/garbled-titles-audit.json
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_OUT = resolve(ROOT, "scripts", ".cache", "garbled-titles-audit.json");

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

function parseArgs(argv: string[]): { source: OfferSource | null; out: string } {
  let source: OfferSource | null = null;
  let out = DEFAULT_OUT;
  for (const raw of argv) {
    if (raw.startsWith("--source=")) source = raw.slice(9) as OfferSource;
    if (raw.startsWith("--out=")) out = resolve(ROOT, raw.slice(6));
  }
  return { source, out };
}

type GarbledRow = {
  source: string;
  offer_id: number;
  display_title_uk: string;
  category_slug: string | null;
  listing_category_slug: string | null;
  slug_hint: string;
  reason: string;
};

async function main(): Promise<void> {
  loadEnv();
  const { source, out } = parseArgs(process.argv.slice(2));

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }

  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
  const { titleNeedsBgRefresh, titleGarbledReason } = await import("../src/lib/title-translate.server");
  const { loadResolvedCategoryMap } = await import("../src/lib/catalog-shelf.server");
  const { loadOffers } = await import("../src/lib/offers.server");

  const [categoryMap, offers] = await Promise.all([
    loadResolvedCategoryMap(),
    loadOffers().catch(() => []),
  ]);
  const offerByKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

  const garbled: GarbledRow[] = [];
  let offset = 0;
  const pageSize = 500;

  while (true) {
    let q = supabaseAdmin
      .from("product_content")
      .select("source, offer_id, display_title_uk")
      .not("display_title_uk", "is", null)
      .range(offset, offset + pageSize - 1);
    if (source) q = q.eq("source", source);
    const { data, error } = await q;
    if (error) {
      console.error("query failed:", error.message);
      process.exit(1);
    }
    const rows = (data ?? []) as { source: string; offer_id: number; display_title_uk: string | null }[];
    if (!rows.length) break;

    for (const row of rows) {
      const title = row.display_title_uk?.trim() ?? "";
      const reason = titleGarbledReason(title);
      if (!title || !reason) continue;
      const key = `${row.source}:${row.offer_id}`;
      const offer = offerByKey.get(key);
      garbled.push({
        source: row.source,
        offer_id: row.offer_id,
        display_title_uk: title,
        category_slug: categoryMap.get(key) ?? null,
        listing_category_slug: offer?.categorySlug ?? null,
        slug_hint: offer?.slug ?? "",
        reason,
      });
    }
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  const bySource: Record<string, number> = {};
  for (const r of garbled) {
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  }

  const report = {
    generated_at: new Date().toISOString(),
    source_filter: source,
    total_garbled: garbled.length,
    by_source: bySource,
    rows: garbled,
  };

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2), "utf8");

  console.log(`Garbled titles: ${garbled.length}`);
  for (const [src, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${n}`);
  }
  console.log(`Written: ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
