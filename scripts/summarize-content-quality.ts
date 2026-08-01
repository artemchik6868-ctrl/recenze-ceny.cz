/**
 * Post-drain QA/html summary for product_content rows with HTML.
 * Usage: npx tsx scripts/summarize-content-quality.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveContentTier } from "../src/lib/ai-content.server.ts";

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

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { splitBrandAndTail } = await import("../src/lib/brand-clean.ts");
const { seoSlugFromRoTitle, shouldPreferRoDerivedSlug } = await import("../src/lib/slugify.ts");

const STEP6_MIN = 1500;

type Row = {
  source: string;
  offer_id: number;
  display_title_uk: string | null;
  description_html_uk: string | null;
  qa_status_uk: string | null;
  qa_reason_uk: string | null;
};

const offers = await loadOffers();
const offerByKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

const rows: Row[] = [];
let from = 0;
const page = 100;
while (true) {
  const { data, error } = await supabaseAdmin
    .from("product_content")
    .select("source,offer_id,display_title_uk,description_html_uk,qa_status_uk,qa_reason_uk")
    .not("description_html_uk", "is", null)
    .range(from, from + page - 1);
  if (error) throw error;
  const chunk = (data ?? []) as Row[];
  rows.push(...chunk);
  if (chunk.length < page) break;
  from += page;
}

type Verdict = "good" | "needs_review" | "bad";

function verdict(row: Row, htmlLen: number): Verdict {
  const tier = deriveContentTier(row.qa_status_uk, row.qa_reason_uk, row.description_html_uk ?? "");
  if (tier === "failed" || htmlLen < STEP6_MIN) return "bad";
  if (row.qa_status_uk === "warn" || (htmlLen >= STEP6_MIN && htmlLen < 1800)) return "needs_review";
  if (row.qa_status_uk === "ok") return "good";
  return "needs_review";
}

function productUrl(row: Row): string {
  const offer = offerByKey.get(`${row.source}:${row.offer_id}`);
  if (!offer) return `https://recenze-ceny.cz/other/offer-${row.offer_id}`;
  const display = row.display_title_uk?.trim() || offer.displayTitle || offer.title;
  const { brand } = splitBrandAndTail(display);
  let slug = offer.slug;
  if (display && shouldPreferRoDerivedSlug(slug, display, offer.brand)) {
    slug = seoSlugFromRoTitle(display, offer.brand, offer.id, offer.source);
  }
  return `https://recenze-ceny.cz/${offer.categorySlug}/${slug}`;
}

const counts = { good: 0, needs_review: 0, bad: 0 };
const qaOk = { ok: 0, warn: 0, other: 0 };
const htmlLens: number[] = [];
const warnReasons = new Map<string, number>();
const bySource = new Map<string, { good: number; needs_review: number; bad: number }>();
const problems: Array<{ key: string; verdict: Verdict; html: number; qa: string; reason: string; title: string; url: string }> = [];

for (const row of rows) {
  const html = row.description_html_uk ?? "";
  const htmlLen = html.length;
  htmlLens.push(htmlLen);
  const v = verdict(row, htmlLen);
  counts[v]++;

  const src = row.source;
  const sc = bySource.get(src) ?? { good: 0, needs_review: 0, bad: 0 };
  sc[v]++;
  bySource.set(src, sc);

  if (row.qa_status_uk === "ok") qaOk.ok++;
  else if (row.qa_status_uk === "warn") {
    qaOk.warn++;
    const r = row.qa_reason_uk ?? "warn";
    for (const part of r.split(";").map((s) => s.trim()).filter(Boolean)) {
      warnReasons.set(part, (warnReasons.get(part) ?? 0) + 1);
    }
  } else qaOk.other++;

  if (v !== "good") {
    problems.push({
      key: `${row.source}:${row.offer_id}`,
      verdict: v,
      html: htmlLen,
      qa: row.qa_status_uk ?? "—",
      reason: row.qa_reason_uk ?? "—",
      title: (row.display_title_uk ?? "").slice(0, 60),
      url: productUrl(row),
    });
  }
}

htmlLens.sort((a, b) => a - b);
const belowMin = htmlLens.filter((n) => n < STEP6_MIN).length;
const median = htmlLens[Math.floor(htmlLens.length / 2)] ?? 0;

const { data: failures } = await supabaseAdmin
  .from("content_gen_failures")
  .select("source,offer_id,fail_count,last_error,locked_until")
  .order("fail_count", { ascending: false });

problems.sort((a, b) => {
  const rank = { bad: 0, needs_review: 1, good: 2 };
  if (rank[a.verdict] !== rank[b.verdict]) return rank[a.verdict] - rank[b.verdict];
  return a.html - b.html;
});

console.log(`\n=== Content quality summary (${rows.length} rows with HTML) ===\n`);
console.log(`Verdict: good=${counts.good} needs_review=${counts.needs_review} bad=${counts.bad}`);
console.log(`QA: ok=${qaOk.ok} warn=${qaOk.warn} other=${qaOk.other}`);
console.log(`HTML: min=${htmlLens[0] ?? 0} median=${median} max=${htmlLens[htmlLens.length - 1] ?? 0} below_${STEP6_MIN}=${belowMin}`);

console.log("\nBy source:");
for (const [src, sc] of [...bySource.entries()].sort()) {
  console.log(`  ${src}: good=${sc.good} review=${sc.needs_review} bad=${sc.bad}`);
}

console.log("\nTop warn reasons:");
for (const [reason, n] of [...warnReasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`  ${n}x ${reason}`);
}

console.log(`\ncontent_gen_failures: ${failures?.length ?? 0} rows`);
for (const f of (failures ?? []).slice(0, 25) as Array<{
  source: string;
  offer_id: number;
  fail_count: number;
  last_error: string | null;
  locked_until: string | null;
}>) {
  console.log(`  ${f.source}:${f.offer_id} fails=${f.fail_count} lock=${f.locked_until?.slice(0, 19) ?? "—"} err=${(f.last_error ?? "").slice(0, 80)}`);
}

console.log("\nTop problems (bad + review, max 20):");
for (const p of problems.slice(0, 20)) {
  console.log(`  [${p.verdict}] ${p.key} html=${p.html} qa=${p.qa} | ${p.title}`);
  console.log(`    ${p.url}`);
}
