/**
 * Force-regenerate AI content for a diverse sample of offers (CH test batch).
 *
 * Usage:
 *   npm run generate:sample-ch -- --count=10 --concurrency=2
 *   npm run generate:sample-ch -- --count=10 --dry-run
 *   npm run generate:sample-ch -- --exclude=kma:7616,shakes:19192
 *
 * Skips offers listed in scripts/ch-sample-generated.json (prior batches).
 *
 * Requires .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_API_KEY (or LOVABLE_API_KEY).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Offer, OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "ch-sample-generated.json");

function loadEnvIntoProcess(): void {
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

type CliOpts = {
  count: number;
  concurrency: number;
  dryRun: boolean;
  seed: number;
  excludeCli: string[];
  noManifest: boolean;
};

function parseArgs(argv: string[]): CliOpts {
  const out: CliOpts = {
    count: 10,
    concurrency: 2,
    dryRun: false,
    seed: Date.now(),
    excludeCli: [],
    noManifest: false,
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
    if (key === "dry-run") {
      out.dryRun = true;
      continue;
    }
    if (key === "no-manifest") {
      out.noManifest = true;
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      applyArg(out, key, next);
      i++;
    }
  }
  return out;
}

function applyArg(out: CliOpts, key: string, val: string): void {
  switch (key) {
    case "count":
      out.count = Math.max(1, Number(val) || out.count);
      break;
    case "concurrency":
      out.concurrency = Math.max(1, Number(val) || out.concurrency);
      break;
    case "seed":
      out.seed = Number(val) || out.seed;
      break;
    case "exclude":
      out.excludeCli = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      break;
    default:
      break;
  }
}

function loadManifestOffers(): string[] {
  if (!existsSync(MANIFEST_PATH)) return [];
  try {
    const data = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as { offers?: string[] };
    return Array.isArray(data.offers) ? data.offers : [];
  } catch {
    console.warn(`WARN: could not read ${MANIFEST_PATH}`);
    return [];
  }
}

function buildExcludeSet(opts: CliOpts): Set<string> {
  const set = new Set<string>();
  if (!opts.noManifest) {
    for (const key of loadManifestOffers()) set.add(key);
  }
  for (const key of opts.excludeCli) set.add(key);
  return set;
}

function saveManifestOffers(keys: string[]): void {
  const unique = [...new Set(keys)].sort();
  writeFileSync(MANIFEST_PATH, `${JSON.stringify({ offers: unique }, null, 2)}\n`, "utf8");
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickSample(offers: Offer[], count: number, seed: number, exclude: Set<string>): Offer[] {
  const pool = offers.filter((o) => !exclude.has(`${o.source}:${o.id}`));
  const rand = mulberry32(seed);
  const bySource = new Map<OfferSource, Map<string, Offer[]>>();
  for (const o of pool) {
    if (!bySource.has(o.source)) bySource.set(o.source, new Map());
    const byCat = bySource.get(o.source)!;
    if (!byCat.has(o.categorySlug)) byCat.set(o.categorySlug, []);
    byCat.get(o.categorySlug)!.push(o);
  }

  const picked: Offer[] = [];
  const usedKeys = new Set<string>();

  const sourceOrder = shuffle([...bySource.keys()], rand);
  for (const source of sourceOrder) {
    if (picked.length >= count) break;
    const byCat = bySource.get(source)!;
    const categories = shuffle([...byCat.keys()], rand);
    for (const cat of categories) {
      const catPool = byCat.get(cat)!;
      const offer = catPool[Math.floor(rand() * catPool.length)];
      const key = `${offer.source}:${offer.id}`;
      if (usedKeys.has(key)) continue;
      usedKeys.add(key);
      picked.push(offer);
      break;
    }
  }

  const remaining = shuffle(
    pool.filter((o) => !usedKeys.has(`${o.source}:${o.id}`)),
    rand,
  );
  for (const o of remaining) {
    if (picked.length >= count) break;
    picked.push(o);
  }

  return picked.slice(0, count);
}

async function main(): Promise<void> {
  loadEnvIntoProcess();
  const opts = parseArgs(process.argv.slice(2));

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (!opts.dryRun && !process.env.AI_API_KEY && !process.env.LOVABLE_API_KEY) {
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY in .env");
    process.exit(1);
  }

  const { loadOffers } = await import("../src/lib/offers.server.ts");
  const { generateMissingContent } = await import("../src/lib/content-backfill.server.ts");
  const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
  const {
    hasDeAtMarketLeak,
    hasChDeliveryCities,
    productContentBlob,
  } = await import("../src/lib/locale-leak-de.ts");
  const { offerDisplayTitle } = await import("../src/lib/offer-display.ts");
  const { SITE } = await import("../src/lib/site.ts");

  const offers = await loadOffers();
  if (offers.length === 0) {
    console.error("No active offers in catalog");
    process.exit(1);
  }

  const exclude = buildExcludeSet(opts);
  const poolSize = offers.filter((o) => !exclude.has(`${o.source}:${o.id}`)).length;
  console.log(`Excluded ${exclude.size} offer(s) from prior batches; ${poolSize} available`);
  if (poolSize < opts.count) {
    console.error(`Only ${poolSize} offers left after exclude (need ${opts.count})`);
    process.exit(1);
  }

  const sample = pickSample(offers, opts.count, opts.seed, exclude);
  if (sample.length < opts.count) {
    console.error(`Could only pick ${sample.length} offers (need ${opts.count})`);
    process.exit(1);
  }

  for (const o of sample) {
    const key = `${o.source}:${o.id}`;
    if (exclude.has(key)) {
      console.error(`FAIL: picked excluded offer ${key}`);
      process.exit(1);
    }
  }

  console.log(`Sample (${sample.length} offers, seed=${opts.seed}):`);
  console.log("source\toffer_id\tcategory\ttitle");
  for (const o of sample) {
    console.log(`${o.source}\t${o.id}\t${o.categorySlug}\t${offerDisplayTitle(o).slice(0, 60)}`);
  }

  const sources = new Set(sample.map((o) => o.source));
  const categories = new Set(sample.map((o) => o.categorySlug));
  console.log(`\nDiversity: ${sources.size} source(s), ${categories.size} category/categories`);

  if (opts.dryRun) {
    console.log("\n=== URLs (dry run) ===");
    for (const o of sample) {
      console.log(`${SITE.url}/${o.categorySlug}/${o.slug}`);
    }
    console.log("\nDry run — no generation.");
    return;
  }

  const bySource = new Map<OfferSource, number[]>();
  for (const o of sample) {
    if (!bySource.has(o.source)) bySource.set(o.source, []);
    bySource.get(o.source)!.push(o.id);
  }

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const [source, ids] of bySource) {
    console.log(`\n=== generate ${source} (${ids.length} offers) ===`);
    const r = await generateMissingContent(source, ids.length, {
      localMode: true,
      concurrency: opts.concurrency,
      onlyMissing: false,
      forceRegen: true,
      offerIds: ids,
    });
    console.log(`  generated=${r.generated} failed=${r.failed} checked=${r.checked}`);
    totalGenerated += r.generated;
    totalFailed += r.failed;
  }

  console.log(`\n=== post-check ===`);
  let postOk = 0;
  let postFail = 0;

  for (const o of sample) {
    const { data, error } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk, description_html_uk, faq_uk")
      .eq("source", o.source)
      .eq("offer_id", o.id)
      .maybeSingle();

    if (error || !data) {
      console.log(`FAIL ${o.source}:${o.id} — no product_content row`);
      postFail += 1;
      continue;
    }

    const blob = productContentBlob({
      display_title: data.display_title_uk,
      description_html: data.description_html_uk,
      faq: data.faq_uk as Array<{ q?: string; a?: string }> | null,
    });

    const deLeak = hasDeAtMarketLeak(blob);
    const hasCities = hasChDeliveryCities(data.description_html_uk ?? "");
    const issues: string[] = [];
    if (deLeak) issues.push("DE/AT market leak");
    if (!hasCities) issues.push("missing CH delivery cities");

    if (issues.length) {
      console.log(`FAIL ${o.source}:${o.id} (${o.categorySlug}) — ${issues.join(", ")}`);
      postFail += 1;
    } else {
      console.log(`OK  ${o.source}:${o.id} (${o.categorySlug})`);
      postOk += 1;
    }
  }

  console.log(
    `\nDone — generated=${totalGenerated} failed=${totalFailed} post-check OK=${postOk} FAIL=${postFail}`,
  );

  console.log("\n=== URLs ===");
  for (const o of sample) {
    console.log(`${SITE.url}/${o.categorySlug}/${o.slug}`);
  }

  if (totalFailed > 0 || postFail > 0) process.exit(1);

  if (!opts.noManifest) {
    const manifestKeys = loadManifestOffers();
    for (const o of sample) manifestKeys.push(`${o.source}:${o.id}`);
    saveManifestOffers(manifestKeys);
    console.log(`\nManifest updated: ${MANIFEST_PATH} (${new Set(manifestKeys).size} total)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
