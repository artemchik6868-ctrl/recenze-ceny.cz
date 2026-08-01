/**
 * Full regen for offers flagged by audit-truncated-brands.ts.
 *
 * Usage:
 *   npx tsx scripts/regen-truncated-brands.ts --dry-run
 *   npx tsx scripts/regen-truncated-brands.ts --limit=20
 *   npx tsx scripts/regen-truncated-brands.ts --only=cpa_tl:9160,cpagetti:15755
 *   npx tsx scripts/regen-truncated-brands.ts --resume
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_AUDIT = resolve(ROOT, "scripts", ".cache", "truncated-brands-audit.json");
const DEFAULT_REPORT = resolve(ROOT, "scripts", ".cache", "truncated-brands-regen.json");

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
    process.env[m[1].trim()] = v;
  }
}

type AuditRow = {
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

type AuditReport = {
  rows: AuditRow[];
};

function parseArgs(argv: string[]): {
  dryRun: boolean;
  limit: number | null;
  onlyKeys: Set<string> | null;
  resume: boolean;
  auditPath: string;
  reportPath: string;
} {
  let dryRun = false;
  let limit: number | null = null;
  let onlyKeys: Set<string> | null = null;
  let resume = false;
  let auditPath = DEFAULT_AUDIT;
  let reportPath = DEFAULT_REPORT;

  for (const raw of argv) {
    if (raw === "--dry-run") dryRun = true;
    if (raw === "--resume") resume = true;
    if (raw.startsWith("--limit=")) limit = Number(raw.slice(8));
    if (raw.startsWith("--only=")) {
      onlyKeys = new Set(
        raw
          .slice(7)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    if (raw.startsWith("--audit=")) auditPath = resolve(ROOT, raw.slice(8));
    if (raw.startsWith("--report=")) reportPath = resolve(ROOT, raw.slice(9));
  }
  return { dryRun, limit, onlyKeys, resume, auditPath, reportPath };
}

loadEnv();

const { dryRun, limit, onlyKeys, resume, auditPath, reportPath } = parseArgs(process.argv.slice(2));

if (!existsSync(auditPath)) {
  console.error(`Audit file not found: ${auditPath}`);
  console.error("Run: npm run audit:truncated-brands");
  process.exit(1);
}

const audit = JSON.parse(readFileSync(auditPath, "utf8")) as AuditReport;
let targets = audit.rows ?? [];

if (onlyKeys) {
  targets = targets.filter((r) => onlyKeys!.has(`${r.source}:${r.offer_id}`));
}

const { getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { loadOffers } = await import("../src/lib/offers.server.ts");
const { truncatedBrandReason, splitBrandAndTail } = await import("../src/lib/brand-clean.ts");

const offers = await loadOffers();
const offerByKey = new Map(offers.map((o) => [`${o.source}:${o.id}`, o]));

console.log(
  `\n=== regen-truncated-brands pipeline=${PIPELINE_VERSION} targets=${targets.length} dry=${dryRun} resume=${resume} ===\n`,
);

type Result = {
  key: string;
  status: "ok" | "fail" | "skip" | "dry";
  ms?: number;
  display_title_uk?: string;
  error?: string;
};

const results: Result[] = [];
let processed = 0;

for (const row of targets) {
  if (limit != null && processed >= limit) break;

  const key = `${row.source}:${row.offer_id}`;
  const offer = offerByKey.get(key);
  if (!offer) {
    console.log(`SKIP ${key} — not in catalog`);
    results.push({ key, status: "skip", error: "not_in_catalog" });
    continue;
  }

  if (resume) {
    const { data } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk, title_uk, description_html_uk")
      .eq("source", row.source)
      .eq("offer_id", row.offer_id)
      .maybeSingle();
    const display = data?.display_title_uk ?? "";
    const stillBad = truncatedBrandReason(display, offer.brand ?? "", offer.title, {
      titleUk: data?.title_uk,
      html: data?.description_html_uk,
    });
    if (!stillBad) {
      console.log(`SKIP ${key} — already fixed`);
      results.push({ key, status: "skip", error: "already_ok" });
      continue;
    }
  }

  if (dryRun) {
    console.log(`DRY ${key} ${row.url} «${row.actual_brand}» → «${row.expected_brand}» (${row.reason})`);
    results.push({ key, status: "dry" });
    processed += 1;
    continue;
  }

  const categorySlug = row.category_slug ?? offer.categorySlug;
  console.log(`--- regen ${key} (${categorySlug}) ${row.url} ---`);
  const t0 = Date.now();
  try {
    const gen = await getOrGenerateProductContentDetailed(
      row.source as OfferSource,
      row.offer_id,
      "uk",
      categorySlug,
      { forceRegen: true },
    );
    const ms = Date.now() - t0;

    const { data } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk, title_uk, description_html_uk, qa_status_uk")
      .eq("source", row.source)
      .eq("offer_id", row.offer_id)
      .maybeSingle();

    const display = data?.display_title_uk ?? "";
    const { brand: brandPart } = splitBrandAndTail(display);
    const stillBad = truncatedBrandReason(display, offer.brand ?? "", offer.title, {
      titleUk: data?.title_uk,
      html: data?.description_html_uk,
    });

    if (stillBad) {
      console.log(`FAIL ${key} ms=${ms} display="${display}" still truncated (${stillBad})`);
      results.push({ key, status: "fail", ms, display_title_uk: display, error: stillBad });
    } else {
      console.log(
        `OK ${key} ms=${ms} brand="${brandPart}" qa=${data?.qa_status_uk ?? "—"} saved=${gen.saved}`,
      );
      results.push({ key, status: "ok", ms, display_title_uk: display });
    }
    processed += 1;
  } catch (err) {
    const ms = Date.now() - t0;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`ERR ${key} ms=${ms}: ${msg}`);
    results.push({ key, status: "fail", ms, error: msg });
    processed += 1;
  }
}

const summary = {
  generated_at: new Date().toISOString(),
  pipeline: PIPELINE_VERSION,
  dry_run: dryRun,
  limit,
  total_targets: targets.length,
  processed,
  ok: results.filter((r) => r.status === "ok").length,
  fail: results.filter((r) => r.status === "fail").length,
  skip: results.filter((r) => r.status === "skip").length,
  dry: results.filter((r) => r.status === "dry").length,
  results,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(summary, null, 2), "utf8");

console.log(
  `\nDone ok=${summary.ok} fail=${summary.fail} skip=${summary.skip} dry=${summary.dry}`,
);
console.log(`Report: ${reportPath}`);

if (summary.fail > 0) process.exit(1);
