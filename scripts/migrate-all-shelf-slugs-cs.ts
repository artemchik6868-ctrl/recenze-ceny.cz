/**
 * Persist Czech SEO slugs into product_briefs.resolved_category_slug
 * (raw DB values — bypasses validateShelfSlug map normalization).
 *
 * Usage:
 *   npx tsx scripts/migrate-all-shelf-slugs-cs.ts --dry-run
 *   npx tsx scripts/migrate-all-shelf-slugs-cs.ts --persist
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_SLUG_REDIRECTS } from "../src/lib/category-slug-redirects";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--persist");

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const legacySlugs = Object.keys(CATEGORY_SLUG_REDIRECTS);

const { data, error } = await supabaseAdmin
  .from("product_briefs")
  .select("source, offer_id, resolved_category_slug")
  .in("resolved_category_slug", legacySlugs);

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

const rows = (data ?? []) as {
  source: string;
  offer_id: number;
  resolved_category_slug: string;
}[];

console.log(`\n=== migrate-all-shelf-slugs-cs — ${rows.length} rows (dryRun=${dryRun}) ===\n`);

const byPair = new Map<string, number>();
for (const r of rows) {
  const to = CATEGORY_SLUG_REDIRECTS[r.resolved_category_slug];
  const k = `${r.resolved_category_slug}→${to}`;
  byPair.set(k, (byPair.get(k) ?? 0) + 1);
}
for (const [k, n] of [...byPair.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${n}`);
}

let ok = 0;
for (const r of rows) {
  const to = CATEGORY_SLUG_REDIRECTS[r.resolved_category_slug];
  if (!to) continue;
  if (dryRun) {
    ok += 1;
    continue;
  }
  const { error: updErr } = await supabaseAdmin
    .from("product_briefs")
    .update({ resolved_category_slug: to })
    .eq("source", r.source)
    .eq("offer_id", r.offer_id);
  if (updErr) {
    console.log(`FAIL ${r.source}:${r.offer_id} ${r.resolved_category_slug}→${to}: ${updErr.message}`);
  } else {
    ok += 1;
  }
}

console.log(`\nDone — updated=${ok}/${rows.length} dryRun=${dryRun}`);
