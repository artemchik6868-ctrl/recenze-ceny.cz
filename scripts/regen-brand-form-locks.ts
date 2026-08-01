/**
 * Regen all offers for brand-form-locked SKUs:
 * Icexin, Hondrofrost (gel), Redusizer (drops), ShiVital (capsules).
 *
 * Usage:
 *   npx tsx scripts/regen-brand-form-locks.ts
 *   npx tsx scripts/regen-brand-form-locks.ts --force-regen
 *   npx tsx scripts/regen-brand-form-locks.ts --force-regen --only=shivital
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--force-regen");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyBrand = onlyArg?.slice("--only=".length).trim().toLowerCase() || null;

const BRAND_FORM_LOCK_RE = /\b(?:icexin|hondrofrost|redusizer|shi\s*vital)\b/i;

function brandLabel(hay: string): string {
  if (/\bicexin\b/i.test(hay)) return "Icexin";
  if (/\bhondrofrost\b/i.test(hay)) return "Hondrofrost";
  if (/\bredusizer\b/i.test(hay)) return "Redusizer";
  if (/\bshi\s*vital\b/i.test(hay)) return "ShiVital";
  return "other";
}

function shouldRegen(offer: { brand?: string; title: string }): boolean {
  const hay = `${offer.brand ?? ""} ${offer.title}`;
  if (!BRAND_FORM_LOCK_RE.test(hay)) return false;
  if (onlyBrand && !brandLabel(hay).toLowerCase().includes(onlyBrand.replace(/\s+/g, ""))) {
    return false;
  }
  return true;
}

const { loadOffers } = await import("../src/lib/offers.server.ts");
const { getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const offers = (await loadOffers()).filter(shouldRegen);

const byBrand = new Map<string, typeof offers>();
for (const o of offers) {
  const label = brandLabel(`${o.brand ?? ""} ${o.title}`);
  const list = byBrand.get(label) ?? [];
  list.push(o);
  byBrand.set(label, list);
}

console.log(
  `\n=== regen-brand-form-locks — ${offers.length} offers (dryRun=${dryRun}) pipeline=${PIPELINE_VERSION} ===\n`,
);
for (const [brand, list] of [...byBrand.entries()].sort()) {
  console.log(`${brand}: ${list.length}`);
  for (const o of list) {
    console.log(`  ${o.source}:${o.id}  [${o.categorySlug}] ${o.title.slice(0, 60)}`);
  }
  console.log();
}

if (dryRun) {
  console.log("Dry run — pass --force-regen to regenerate.");
  process.exit(0);
}

let ok = 0;
let fail = 0;

for (const o of offers) {
  const label = brandLabel(`${o.brand ?? ""} ${o.title}`);
  console.log(`--- ${label} ${o.source}:${o.id} [${o.categorySlug}] ---`);
  const t0 = Date.now();
  try {
    const gen = await getOrGenerateProductContentDetailed(o.source, o.id, "uk", o.categorySlug, {
      forceRegen: true,
    });
    const { data } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk,description_html_uk,qa_status_uk,qa_reason_uk")
      .eq("source", o.source)
      .eq("offer_id", o.id)
      .maybeSingle();

    const html = data?.description_html_uk ?? "";
    const blob = `${data?.display_title_uk ?? ""}${html}`;
    const row = data as {
      display_title_uk?: string;
      qa_status_uk?: string;
      qa_reason_uk?: string;
    } | null;

    if (gen.status === "generated" || gen.status === "cache_hit") {
      ok += 1;
    } else {
      fail += 1;
    }

    console.log(`status: ${gen.status} ms: ${Date.now() - t0}`);
    console.log(`title: ${row?.display_title_uk}`);
    console.log(`qa: ${row?.qa_status_uk} | ${row?.qa_reason_uk}`);
    console.log(
      `gel: ${/\bgel\b/i.test(blob)} kapky: ${/\bkapk/i.test(blob)} kapsle: ${/\bkapsl/i.test(blob)} doplnek: ${/dopln[eě]k stravy/i.test(html)}`,
    );
  } catch (err) {
    fail += 1;
    console.error(`FAIL ${o.source}:${o.id}:`, err);
  }
  console.log();
}

console.log(`Done — ok=${ok} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
