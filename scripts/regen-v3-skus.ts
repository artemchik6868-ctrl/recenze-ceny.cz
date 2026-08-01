/**
 * Regenerate DE content for v1-de-quality-3 smoke SKUs.
 * Usage: npx tsx scripts/regen-v3-skus.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(): void {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
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

const JOBS: [OfferSource, number, string][] = [
  ["adcombo", 33950, "chrapani"],
  ["shakes", 21182, "hubnuti"],
  ["shakes", 21064, "stres"],
  ["shakes", 15928, "hubnuti"],
  ["m1_top", 5482, "klouby"],
  ["shakes", 21956, "papilomy"],
];

async function main(): Promise<void> {
  loadEnv();
  const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");
  const { pickReviews } = await import("../src/lib/reviews.ts");

  for (const [source, id, cat] of JOBS) {
    const started = Date.now();
    process.stdout.write(`regen ${source}:${id} ... `);
    try {
      const out = await getOrGenerateProductContent(source, id, "uk", cat, { forceRegen: true });
      const reviews = pickReviews(id, 5, "de", "any", cat);
      console.log(
        `OK tier=${out?.content_tier} title=${JSON.stringify(out?.display_title_uk?.slice(0, 55))} reviews=${reviews.length} ms=${Date.now() - started}`,
      );
    } catch (e) {
      console.log(`FAIL ${e instanceof Error ? e.message : e}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
