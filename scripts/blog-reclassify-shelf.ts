/**
 * Re-bind a published blog post to one or more catalog shelves and refresh product_ids.
 *
 * Usage:
 *   npx tsx scripts/blog-reclassify-shelf.ts --slug=... --shelf=cukrovka
 *   npx tsx scripts/blog-reclassify-shelf.ts --slug=... --shelf=cukrovka,stres
 *   npx tsx scripts/blog-reclassify-shelf.ts --slug=... --shelf=cukrovka,stres --dry-run
 *
 * First shelf is primary (category_slug). Multi-shelf picks 2 products from each.
 *
 * Requires .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (same as blog-ingest).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { reclassifyBlogPostShelf } from "../src/lib/blog-ingest.server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvIntoProcess(): void {
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      const key = m[1].trim();
      if (!(key in process.env) || process.env[key] === "") {
        process.env[key] = v;
      }
    }
  } catch {
    /* CI may inject env without .env file */
  }
}

function parseArgs(argv: string[]): { slug: string; shelf: string; dryRun: boolean } {
  let slug = "";
  let shelf = "";
  let dryRun = false;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--slug=")) slug = a.slice("--slug=".length).trim();
    else if (a.startsWith("--shelf=")) shelf = a.slice("--shelf=".length).trim();
  }
  if (!slug || !shelf) {
    console.error(
      "Usage: npx tsx scripts/blog-reclassify-shelf.ts --slug=<slug> --shelf=<shelf[,shelf2]> [--dry-run]",
    );
    process.exit(2);
  }
  return { slug, shelf, dryRun };
}

async function main(): Promise<void> {
  loadEnvIntoProcess();
  const opts = parseArgs(process.argv.slice(2));
  const result = await reclassifyBlogPostShelf({
    slug: opts.slug,
    categorySlug: opts.shelf,
    dryRun: opts.dryRun,
  });
  console.log(
    `[blog-reclassify] ${result.dryRun ? "dry-run" : "updated"} /clanky/${result.slug}`,
  );
  console.log(
    `  ${result.previousCategorySlug} → ${result.categorySlugs.join("+")} products=${result.productIds.length}`,
  );
  console.log(`  product_ids: ${result.productIds.join(", ")}`);
}

main().catch((e) => {
  console.error("[blog-reclassify] fail:", e instanceof Error ? e.message : e);
  process.exit(1);
});
