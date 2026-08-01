/**
 * Stamp product_content.source_hash to the current feed + PIPELINE_VERSION without LLM.
 * Use after a bulk local generation when only the version constant drifted (false stale queue).
 *
 * Usage:
 *   npx tsx scripts/reconcile-content-hashes.ts --dry-run
 *   npx tsx scripts/reconcile-content-hashes.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINE_SOURCES } from "../src/lib/content-pipeline.server";
import { getExpectedSourceHash, PIPELINE_VERSION } from "../src/lib/ai-content.server";
import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (!(m[1].trim() in process.env) || process.env[m[1].trim()] === "") {
    process.env[m[1].trim()] = v;
  }
}

const dryRun = process.argv.includes("--dry-run");

function isComplete(row: {
  display_title_uk: string | null;
  description_html_uk: string | null;
  faq_uk: unknown;
}): boolean {
  const faqLen = Array.isArray(row.faq_uk) ? row.faq_uk.length : 0;
  return Boolean(row.display_title_uk && row.description_html_uk && faqLen >= 3);
}

async function reconcileSource(source: OfferSource): Promise<{
  scanned: number;
  updated: number;
  skipped: number;
  failed: number;
}> {
  const { data: rows, error } = await supabaseAdmin
    .from("product_content")
    .select("offer_id,source_hash,display_title_uk,description_html_uk,faq_uk")
    .eq("source", source);
  if (error) throw new Error(`${source}: ${error.message}`);

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    if (!isComplete(row as Parameters<typeof isComplete>[0])) continue;
    scanned += 1;
    const offerId = (row as { offer_id: number }).offer_id;
    const stored = String((row as { source_hash: string | null }).source_hash ?? "");
    try {
      const expected = await getExpectedSourceHash(source, offerId);
      if (!expected || expected === stored) {
        skipped += 1;
        continue;
      }
      if (dryRun) {
        console.log(`[dry-run] ${source}:${offerId} ${stored} -> ${expected}`);
        updated += 1;
        continue;
      }
      const { error: upErr } = await supabaseAdmin
        .from("product_content")
        .update({ source_hash: expected })
        .eq("source", source)
        .eq("offer_id", offerId);
      if (upErr) {
        failed += 1;
        console.warn(`[reconcile] ${source}:${offerId} update failed:`, upErr.message);
      } else {
        updated += 1;
      }
    } catch (err) {
      failed += 1;
      console.warn(`[reconcile] ${source}:${offerId} hash failed:`, err);
    }
  }

  return { scanned, updated, skipped, failed };
}

async function main(): Promise<void> {
  console.log(
    `reconcile-content-hashes pipeline=${PIPELINE_VERSION} dryRun=${dryRun}`,
  );
  let totalUpdated = 0;
  let totalScanned = 0;
  let totalFailed = 0;

  for (const source of PIPELINE_SOURCES) {
    const r = await reconcileSource(source);
    totalScanned += r.scanned;
    totalUpdated += r.updated;
    totalFailed += r.failed;
    console.log(
      `${source}: scanned=${r.scanned} updated=${r.updated} skipped=${r.skipped} failed=${r.failed}`,
    );
  }

  console.log(
    `\nDone: scanned=${totalScanned} updated=${totalUpdated} failed=${totalFailed}${dryRun ? " (dry-run)" : ""}`,
  );
  if (totalFailed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
