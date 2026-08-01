/**
 * Trace step 6 HTML truncation and optionally force-regen problematic offers.
 *
 * Usage:
 *   npx tsx scripts/trace-step6-regen.ts --trace-only
 *   npx tsx scripts/trace-step6-regen.ts --regen
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";
import type { Step6TraceResult } from "../src/lib/ai-content.server.ts";

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
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = v;
    }
  }
}

const TARGETS: { source: OfferSource; id: number; label: string; category: string }[] = [
  { source: "cpa_tl", id: 23639, label: "ArthroLead", category: "klouby" },
  { source: "adcombo", id: 34542, label: "Hyperdrops", category: "krevni-tlak" },
];

function countH2(html: string): number {
  return (html.match(/<h2[\s>]/gi) ?? []).length;
}

function extractH2Titles(html: string): string[] {
  const titles: string[] = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    titles.push(m[1].replace(/<[^>]+>/g, "").trim());
  }
  return titles;
}

function printTrace(label: string, trace: Step6TraceResult): void {
  console.log(`\n=== ${label} (${trace.source}:${trace.offerId}) ===`);
  console.log(`display_title: ${trace.displayTitle}`);
  console.log(`prompt_chars: ${trace.prompt_chars}`);
  console.log(`production_would_accept: ${trace.production_would_accept}`);
  console.log(`final_html_chars: ${trace.final_html_chars ?? "—"}`);

  for (const a of trace.attempts) {
    console.log(`\n  attempt ${a.attempt}:`);
    console.log(`    raw_chars=${a.raw_chars} raw_h2=${a.raw_h2_count} finish=${a.finish_reason ?? "?"}`);
    console.log(`    completion_tokens=${a.completion_tokens} max_tokens=${a.max_tokens}`);
    console.log(`    parse: fence=${a.after_fence_chars ?? "—"} slice@${a.slice_start_offset}`);
    console.log(`    trim: before=${a.before_trim_chars} after=${a.after_trim_chars} removed=${a.trim_removed_chars}`);
    console.log(`    parsed_h2=${a.parsed_h2_count} validate=${a.validate_passed} stage=${a.truncation_stage}`);
    if (a.validate_error) console.log(`    validate_error: ${a.validate_error}`);
    console.log(`    h2_titles: ${a.parsed_h2_titles.join(" | ") || "—"}`);
    console.log(`    raw_tail: ...${a.raw_tail.replace(/\s+/g, " ").slice(-120)}`);
  }
}

function printDbRow(
  label: string,
  url: string,
  data: {
    display_title_uk: string | null;
    qa_status_uk: string | null;
    qa_reason_uk: string | null;
    description_html_uk: string | null;
  } | null,
): void {
  const html = data?.description_html_uk ?? "";
  console.log(`\n--- DB after regen: ${label} ---`);
  console.log(`url: ${url}`);
  console.log(`display_title: ${data?.display_title_uk ?? "—"}`);
  console.log(`qa: ${data?.qa_status_uk ?? "—"} | ${data?.qa_reason_uk ?? "—"}`);
  console.log(`html_len: ${html.length} h2: ${countH2(html)}`);
  console.log(`h2_titles: ${extractH2Titles(html).join(" | ") || "—"}`);
}

async function main(): Promise<void> {
  loadEnv();

  const traceOnly = process.argv.includes("--trace-only");
  const regen = process.argv.includes("--regen");
  if (!traceOnly && !regen) {
    console.error("Pass --trace-only and/or --regen");
    process.exit(1);
  }

  const { traceStep6Html, getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import(
    "../src/lib/ai-content.server.ts"
  );
  const { loadOffers } = await import("../src/lib/offers.server.ts");
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

  const offers = await loadOffers();
  const cacheDir = resolve(__dirname, ".cache");
  mkdirSync(cacheDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const report: {
    pipeline: string;
    mode: string;
    timestamp: string;
    traces: Step6TraceResult[];
    regen?: Array<{
      key: string;
      label: string;
      url: string;
      ms: number;
      html_len: number;
      h2_count: number;
      h2_titles: string[];
      qa_status: string | null;
      qa_reason: string | null;
    }>;
  } = {
    pipeline: PIPELINE_VERSION,
    mode: [traceOnly && "trace-only", regen && "regen"].filter(Boolean).join("+"),
    timestamp: stamp,
    traces: [],
  };

  console.log(`pipeline=${PIPELINE_VERSION} mode=${report.mode}\n`);

  if (traceOnly) {
    console.log("Phase A: trace step 6 (no DB write)");
    for (const t of TARGETS) {
      const t0 = Date.now();
      const trace = await traceStep6Html(t.source, t.id);
      if (!trace) {
        console.error(`${t.label}: offer not found`);
        continue;
      }
      printTrace(t.label, trace);
      report.traces.push(trace);
      console.log(`  (${Date.now() - t0} ms)`);
    }
  }

  if (regen) {
    console.log("\nPhase B: force regen");
    report.regen = [];
    for (const t of TARGETS) {
      const offer = offers.find((o) => o.source === t.source && o.id === t.id);
      if (!offer) {
        console.error(`${t.label}: not in offers list`);
        continue;
      }
      const url = `https://recenze-ceny.cz/${t.category}/${offer.slug}`;
      const t0 = Date.now();
      await getOrGenerateProductContentDetailed(t.source, t.id, "uk", offer.categorySlug, {
        forceRegen: true,
      });
      const { data } = await supabaseAdmin
        .from("product_content")
        .select("display_title_uk,qa_status_uk,qa_reason_uk,description_html_uk")
        .eq("source", t.source)
        .eq("offer_id", t.id)
        .maybeSingle();
      const html = data?.description_html_uk ?? "";
      const h2Titles = extractH2Titles(html);
      printDbRow(t.label, url, data);
      report.regen.push({
        key: `${t.source}:${t.id}`,
        label: t.label,
        url,
        ms: Date.now() - t0,
        html_len: html.length,
        h2_count: countH2(html),
        h2_titles: h2Titles,
        qa_status: data?.qa_status_uk ?? null,
        qa_reason: data?.qa_reason_uk ?? null,
      });
    }

    console.log("\nPhase C: post-regen trace step 6");
    for (const t of TARGETS) {
      const trace = await traceStep6Html(t.source, t.id);
      if (!trace) continue;
      printTrace(`${t.label} (post-regen trace)`, trace);
      report.traces.push({ ...trace, offerId: t.id });
    }
  }

  const outPath = resolve(cacheDir, `step6-trace-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nReport saved: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
