/**
 * Batch RO card titles: feed → clean → translate descriptor → product_content.display_title_uk
 *
 * Usage:
 *   npm run localize:titles:cz
 *   npm run localize:titles:cz -- --limit=50 --source=shakes
 *   npm run localize:titles:cz -- --force --concurrency=4
 *   npm run localize:titles:cz -- --source=cpagetti --only-garbled --force
 *   npm run localize:titles:cz -- --only-garbled --enriched --force --limit=500
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CACHE_DIR = resolve(ROOT, "scripts", ".cache", "localize-titles-ro");

type CliOpts = {
  source: OfferSource | null;
  limit: number;
  concurrency: number;
  force: boolean;
  onlyMissing: boolean;
  onlyGarbled: boolean;
  enriched: boolean;
  dryRun: boolean;
};

function loadEnvIntoProcess(): void {
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

function parseArgs(argv: string[]): CliOpts {
  const out: CliOpts = {
    source: null,
    limit: 300,
    concurrency: 3,
    force: false,
    onlyMissing: true,
    onlyGarbled: false,
    enriched: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const eq = raw.indexOf("=");
    if (eq !== -1) {
      applyArg(out, raw.slice(2, eq), raw.slice(eq + 1));
      continue;
    }
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      applyArg(out, key, next);
      i++;
    } else {
      applyArg(out, key, "1");
    }
  }
  return out;
}

function applyArg(out: CliOpts, key: string, val: string): void {
  switch (key) {
    case "source":
      out.source = val as OfferSource;
      break;
    case "limit":
      out.limit = Math.max(1, Number(val) || out.limit);
      break;
    case "concurrency":
      out.concurrency = Math.max(1, Number(val) || out.concurrency);
      break;
    case "force":
      out.force = val === "1" || val === "true";
      break;
    case "only-missing":
      out.onlyMissing = val !== "0" && val !== "false";
      break;
    case "only-garbled":
      out.onlyGarbled = val !== "0" && val !== "false";
      if (out.onlyGarbled) out.enriched = true;
      break;
    case "enriched":
      out.enriched = val !== "0" && val !== "false";
      break;
    case "no-enriched":
      out.enriched = false;
      break;
    case "dry-run":
      out.dryRun = val === "1" || val === "true";
      break;
    default:
      break;
  }
}

function cacheKey(source: string, offerId: number, tailHash: string): string {
  return `${source}-${offerId}-${tailHash}`;
}

function tailHash(rawTitle: string): string {
  return createHash("sha256").update(rawTitle).digest("hex").slice(0, 16);
}

function readCache(key: string): string | null {
  const p = resolve(CACHE_DIR, `${key}.txt`);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8").trim() || null;
}

function writeCache(key: string, title: string): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(resolve(CACHE_DIR, `${key}.txt`), title, "utf8");
}

type TitleJob = {
  source: OfferSource;
  id: number;
  title: string;
  brand: string;
  categorySlug?: string;
  formKind?: string | null;
  feedSnippet?: string;
  listingSlug?: string;
};

const FEED_TABLES: { source: OfferSource; table: string; titleField: "title" | "name" }[] = [
  { source: "cpa_tl", table: "cpa_tl_offers", titleField: "title" },
  { source: "kma", table: "kma_offers", titleField: "name" },
  { source: "m1_top", table: "m1_offers", titleField: "name" },
  { source: "cpagetti", table: "cpagetti_offers", titleField: "title" },
  { source: "adcombo", table: "adcombo_offers", titleField: "title" },
  { source: "shakes", table: "shakes_offers", titleField: "title" },
  { source: "terraleads", table: "terraleads_offers", titleField: "title" },
];

async function loadTitleJobs(): Promise<TitleJob[]> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
  const { cleanBrandName } = await import("../src/lib/brand-clean");
  const jobs: TitleJob[] = [];

  for (const { source, table, titleField } of FEED_TABLES) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(`offer_id, ${titleField}`)
      .eq("is_active", true);
    if (error) {
      console.warn(`load ${table}:`, error.message);
      continue;
    }
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const id = Number(row.offer_id);
      const title = String(row[titleField] ?? "").trim();
      if (!id || !title) continue;
      const brand = cleanBrandName(title) || title.split(/\s+/)[0] || title;
      jobs.push({ source, id, title, brand });
    }
  }
  return jobs;
}

async function loadJobMetadata(): Promise<Map<string, { categorySlug?: string; formKind?: string | null }>> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
  const { loadResolvedCategoryMap } = await import("../src/lib/catalog-shelf.server");
  const { loadOffers } = await import("../src/lib/offers.server");
  const [categoryMap, contentRes, offers] = await Promise.all([
    loadResolvedCategoryMap(),
    supabaseAdmin.from("product_content").select("source, offer_id, form_kind"),
    loadOffers().catch(() => [] as Awaited<ReturnType<typeof loadOffers>>),
  ]);
  const meta = new Map<string, { categorySlug?: string; formKind?: string | null }>();
  for (const [key, slug] of categoryMap) {
    const cur = meta.get(key) ?? {};
    cur.categorySlug = slug;
    meta.set(key, cur);
  }
  for (const o of offers) {
    const key = `${o.source}:${o.id}`;
    const cur = meta.get(key) ?? {};
    if (!cur.categorySlug && o.categorySlug && o.categorySlug !== "other") {
      cur.categorySlug = o.categorySlug;
    }
    if (!cur.formKind && o.formKind) cur.formKind = o.formKind;
    meta.set(key, cur);
  }
  if (!contentRes.error) {
    for (const row of (contentRes.data ?? []) as {
      source: string;
      offer_id: number;
      form_kind: string | null;
    }[]) {
      const key = `${row.source}:${row.offer_id}`;
      const cur = meta.get(key) ?? {};
      if (row.form_kind) cur.formKind = row.form_kind;
      meta.set(key, cur);
    }
  }
  return meta;
}

async function enrichJobsWithCatalog(
  jobs: TitleJob[],
  meta: Map<string, { categorySlug?: string; formKind?: string | null }>,
  enriched: boolean,
): Promise<TitleJob[]> {
  if (!enriched) {
    return enrichJobs(jobs, meta);
  }
  const { loadTitleEnrichMaps, buildEnrichedTitleMeta } = await import("../src/lib/title-enrich.server");
  const maps = await loadTitleEnrichMaps();
  return jobs.map((job) => {
    const base = meta.get(`${job.source}:${job.id}`);
    const row = buildEnrichedTitleMeta(job.source, job.id, job.title, maps, base);
    return { ...job, ...row };
  });
}

async function enrichJobs(jobs: TitleJob[], meta: Map<string, { categorySlug?: string; formKind?: string | null }>): Promise<TitleJob[]> {
  return jobs.map((job) => {
    const m = meta.get(`${job.source}:${job.id}`);
    if (!m) return job;
    return { ...job, categorySlug: m.categorySlug, formKind: m.formKind };
  });
}

async function loadExistingTitles(): Promise<Map<string, string>> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
  const map = new Map<string, string>();
  const { data, error } = await supabaseAdmin
    .from("product_content")
    .select("source, offer_id, display_title_uk");
  if (error || !data) return map;
  for (const row of data as { source: string; offer_id: number; display_title_uk: string | null }[]) {
    if (row.display_title_uk?.trim()) {
      map.set(`${row.source}:${row.offer_id}`, row.display_title_uk.trim());
    }
  }
  return map;
}

async function persistDisplayTitle(
  source: string,
  offerId: number,
  displayTitle: string,
  sourceHash: string,
): Promise<void> {
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
  const key = { source, offer_id: offerId };
  const patch = {
    display_title_uk: displayTitle,
    display_title_ru: displayTitle,
    generated_at: new Date().toISOString(),
    source_hash: sourceHash,
  };

  let lastErr: string | null = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const { data: existing } = await supabaseAdmin
        .from("product_content")
        .select("offer_id")
        .eq("source", source)
        .eq("offer_id", offerId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin.from("product_content").update(patch).match(key);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabaseAdmin.from("product_content").insert({
          ...key,
          ...patch,
          title_uk: displayTitle,
          subtitle_uk: "",
          meta_desc_uk: "",
          intro_uk: "",
          sections_uk: [],
          faq_uk: [],
        });
        if (error) throw new Error(error.message);
      }
      return;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      if (attempt < 4) await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  throw new Error(`${source}:${offerId}: ${lastErr}`);
}

async function processOffer(
  job: TitleJob,
  existing: Map<string, string>,
  opts: CliOpts,
): Promise<"skipped" | "ok" | "failed"> {
  const key = `${job.source}:${job.id}`;
  const existingTitle = existing.get(key);
  const { titleNeedsBgRefresh } = await import("../src/lib/title-translate.server");
  if (opts.onlyGarbled && existingTitle && !titleNeedsBgRefresh(existingTitle)) {
    return "skipped";
  }
  if (opts.onlyMissing && !opts.force && !opts.onlyGarbled && existingTitle && !titleNeedsBgRefresh(existingTitle)) {
    return "skipped";
  }

  const hash = tailHash(opts.enriched ? `${job.title}\n${job.feedSnippet ?? ""}` : job.title);
  const ck = cacheKey(job.source, job.id, hash);
  let displayTitle = !opts.force ? readCache(ck) : null;

  const { mechanicalBgDisplayTitleFromFeed, isBrandOnlyDisplayTitle } = await import(
    "../src/lib/offer-display.ts",
  );
  const seed = `${job.source}:${job.id}:${job.brand}`;
  const mechanical = mechanicalBgDisplayTitleFromFeed({
    rawTitle: job.title,
    brand: job.brand,
    categorySlug: job.categorySlug,
    formKind: job.formKind,
    seed,
  });

  if (
    mechanical &&
    (isBrandOnlyDisplayTitle(existingTitle, job.brand) ||
      isBrandOnlyDisplayTitle(displayTitle, job.brand))
  ) {
    displayTitle = mechanical;
    writeCache(ck, displayTitle);
  }

  if (!displayTitle) {
    const { buildBgDisplayTitleFromFeed } = await import("../src/lib/title-translate.server");
    const result = await buildBgDisplayTitleFromFeed({
      rawTitle: job.title,
      brand: job.brand,
      feedSnippet: job.feedSnippet ?? job.title,
      categorySlug: job.categorySlug,
      formKind: job.formKind,
    });
    displayTitle = result.displayTitle;
    if (
      mechanical &&
      (!displayTitle?.trim() || isBrandOnlyDisplayTitle(displayTitle, job.brand))
    ) {
      displayTitle = mechanical;
    }
    writeCache(ck, displayTitle);
  }

  if (!displayTitle?.trim()) return "failed";

  const { hasNonCzechLocaleLeak } = await import("../src/lib/locale-leak-cz");
  if (hasNonCzechLocaleLeak(displayTitle)) {
    const { buildBgDisplayTitleFromFeed } = await import("../src/lib/title-translate.server");
    const retry = await buildBgDisplayTitleFromFeed({
      rawTitle: existingTitle || job.title,
      brand: job.brand,
      feedSnippet: job.feedSnippet ?? job.title,
      categorySlug: job.categorySlug,
      formKind: job.formKind,
    });
    if (retry.displayTitle?.trim() && !hasNonCzechLocaleLeak(retry.displayTitle)) {
      displayTitle = retry.displayTitle;
    }
  }

  const sourceHash = `title-ro-v1-${hash}`;
  if (!opts.dryRun) {
    await persistDisplayTitle(job.source, job.id, displayTitle, sourceHash);
  }
  console.log(`OK  ${key}: ${displayTitle}`);
  return "ok";
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

async function main(): Promise<void> {
  loadEnvIntoProcess();
  const opts = parseArgs(process.argv.slice(2));

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (!process.env.AI_API_KEY && !process.env.LOVABLE_API_KEY) {
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY in .env");
    process.exit(1);
  }

  console.log(
    `localize:titles:cz limit=${opts.limit} concurrency=${opts.concurrency} onlyMissing=${opts.onlyMissing} onlyGarbled=${opts.onlyGarbled} enriched=${opts.enriched} force=${opts.force} dryRun=${opts.dryRun}`,
  );

  const [jobs, existing, meta] = await Promise.all([loadTitleJobs(), loadExistingTitles(), loadJobMetadata()]);
  let filtered = await enrichJobsWithCatalog(jobs, meta, opts.enriched);
  if (opts.source) filtered = filtered.filter((o) => o.source === opts.source);
  if (opts.onlyGarbled) {
    const { titleNeedsBgRefresh } = await import("../src/lib/title-translate.server");
    filtered = filtered.filter((job) => {
      const title = existing.get(`${job.source}:${job.id}`);
      return !title || titleNeedsBgRefresh(title);
    });
  }
  filtered = filtered.slice(0, opts.limit);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  await runPool(filtered, opts.concurrency, async (job) => {
    try {
      const r = await processOffer(job, existing, opts);
      if (r === "ok") ok++;
      else if (r === "skipped") skipped++;
      else failed++;
    } catch (err) {
      failed++;
      console.error(`FAIL ${job.source}:${job.id}:`, err);
    }
  });

  console.log(`\nDone — ok=${ok} skipped=${skipped} failed=${failed} total=${filtered.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
