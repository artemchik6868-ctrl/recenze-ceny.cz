/**
 * Regen wave for Copy Anchor v10 — multi-SKU brands + problem-shelf clusters.
 *
 * Usage:
 *   npx tsx scripts/regen-brand-families.ts --dry-run
 *   npx tsx scripts/regen-brand-families.ts --force-regen
 *   npx tsx scripts/regen-brand-families.ts --force-regen --from-audit
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--force-regen");
const fromAudit = process.argv.includes("--from-audit");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
let onlyKeys = onlyArg
  ? new Set(onlyArg.slice(7).split(",").map((s) => s.trim()).filter(Boolean))
  : null;

if (fromAudit && !onlyKeys) {
  const cacheDir = resolve(root, "scripts", ".cache");
  const latest = readdirSync(cacheDir)
    .filter((f) => f.startsWith("audit-disputed-") && f.endsWith(".json"))
    .sort()
    .reverse()[0];
  if (latest) {
    const { summary } = JSON.parse(readFileSync(resolve(cacheDir, latest), "utf8")) as {
      summary?: { failKeys?: string[] };
    };
    onlyKeys = new Set(summary?.failKeys ?? []);
    console.log(`Loaded ${onlyKeys.size} fail keys from ${latest}`);
  }
}

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

function shouldRegen(offer: {
  source: string;
  id: number;
  title: string;
  brand?: string;
  categorySlug: string;
}): boolean {
  const key = `${offer.source}:${offer.id}`;
  if (onlyKeys) return onlyKeys.has(key);

  const hay = `${offer.brand ?? ""} ${offer.title}`.toLowerCase();
  if (BRAND_FAMILY_RE.test(hay)) return true;
  if (PROBLEM_SLUGS.has(offer.categorySlug)) return true;
  if (offer.categorySlug === "boty" && CLOTHING_ON_SHOES_RE.test(hay)) return true;
  return false;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContent, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);

const offers = (await loadOffers()).filter(shouldRegen);

console.log(
  `\n=== regen-brand-families — ${offers.length} offers (dryRun=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);

let ok = 0;
let fail = 0;

for (const o of offers) {
  console.log(`REGEN ${o.source}:${o.id}  [${o.categorySlug}] ${o.title.slice(0, 55)}`);
  if (dryRun) {
    ok += 1;
    continue;
  }
  const out = await getOrGenerateProductContent(o.source, o.id, "uk", o.categorySlug, {
    forceRegen: true,
  });
  if (out?.description_html && out.description_html.length >= 400) {
    ok += 1;
    console.log(`  OK   ${out.display_title?.slice(0, 72)}`);
  } else {
    fail += 1;
    console.log(`  FAIL tier=${out?.content_tier ?? "null"}`);
  }
}

console.log(`\nDone — ok=${ok} fail=${fail} dryRun=${dryRun}`);
