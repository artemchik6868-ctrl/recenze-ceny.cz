/**
 * Local AI content batch — calls generateMissingContent directly (no Worker HTTP).
 * Writes to Supabase via the same pipeline as prod backfill/cron.
 *
 * Usage:
 *   npm run generate:local -- --source=kma --limit=8 --concurrency=3
 *   npm run generate:local -- --limit=6
 *   npm run generate:local -- --source=cpa_tl --force-regen --only-missing=false
 *
 * Requires .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_API_KEY (or LOVABLE_API_KEY).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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
  source: OfferSource | null;
  category: string | null;
  task: "ai" | "all";
  limit: number;
  concurrency: number;
  maxRounds: number;
  forceRegen: boolean;
  onlyMissing: boolean;
  pauseMs: number;
};

function parseArgs(argv: string[]): CliOpts {
  const out: CliOpts = {
    source: null,
    category: null,
    task: "ai",
    limit: 8,
    concurrency: 3,
    maxRounds: 50,
    forceRegen: false,
    onlyMissing: true,
    pauseMs: 2000,
  };
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const eq = raw.indexOf("=");
    if (eq !== -1) {
      const key = raw.slice(2, eq);
      const val = raw.slice(eq + 1);
      applyArg(out, key, val);
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
    case "category":
      out.category = val.trim() || null;
      break;
    case "task":
      if (val === "ai" || val === "all") out.task = val;
      else if (val === "img") {
        console.error("task=img removed — product images are partner hotlinks (no Storage resize/prewarm)");
        process.exit(1);
      }
      break;
    case "limit":
      out.limit = Math.max(1, Number(val) || out.limit);
      break;
    case "concurrency":
      out.concurrency = Math.max(1, Number(val) || out.concurrency);
      break;
    case "max-rounds":
      out.maxRounds = Math.max(1, Number(val) || out.maxRounds);
      break;
    case "force-regen":
      out.forceRegen = val === "1" || val === "true";
      break;
    case "only-missing":
      out.onlyMissing = val !== "0" && val !== "false";
      break;
    case "pause-ms":
      out.pauseMs = Math.max(0, Number(val) || out.pauseMs);
      break;
    default:
      break;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  loadEnvIntoProcess();
  const opts = parseArgs(process.argv.slice(2));

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (!process.env.AI_API_KEY && !process.env.LOVABLE_API_KEY) {
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY in .env");
    process.exit(1);
  }

  const { generateMissingContent, countPendingContent } = await import(
    "../src/lib/content-backfill.server.ts"
  );
  const { PIPELINE_SOURCES } = await import("../src/lib/content-pipeline.server.ts");

  const sources = opts.source ? [opts.source] : PIPELINE_SOURCES;
  let totalGenerated = 0;
  let hadFatal = false;

  console.log(
    `Local generate — task=${opts.task} limit=${opts.limit} concurrency=${opts.concurrency} onlyMissing=${opts.onlyMissing} forceRegen=${opts.forceRegen}${opts.category ? ` category=${opts.category}` : ""}`,
  );

  for (const source of sources) {
    console.log(`\n=== ${source} ===`);
    let sourceGenerated = 0;
    let regenOffset = 0;

    if (opts.task === "ai" || opts.task === "all") {
      for (let round = 1; round <= opts.maxRounds; round++) {
        const started = Date.now();
        const r = await generateMissingContent(source, opts.limit, {
          localMode: true,
          concurrency: opts.concurrency,
          onlyMissing: opts.onlyMissing,
          forceRegen: opts.forceRegen,
          categorySlug: opts.category ?? undefined,
          startOffset: opts.forceRegen && !opts.onlyMissing ? regenOffset : undefined,
        });
        const elapsed = Date.now() - started;
        let pendingNow = -1;
        try {
          pendingNow = await countPendingContent(source);
        } catch {
          /* logged in summary */
        }
        console.log(
          `  [ai] round ${round}: generated=${r.generated} failed=${r.failed} checked=${r.checked} pending=${pendingNow} elapsed=${elapsed}ms`,
        );
        sourceGenerated += r.generated;
        if (r.generated === 0) break;
        if (opts.onlyMissing && pendingNow === 0) break;
        if (opts.forceRegen && !opts.onlyMissing) regenOffset += opts.limit;
        if (opts.pauseMs > 0 && round < opts.maxRounds) {
          await sleep(opts.pauseMs);
        }
      }
    }

    try {
      const pending = await countPendingContent(source);
      console.log(
        `  summary: generated=${sourceGenerated} pending_content=${pending}`,
      );
    } catch (err) {
      console.warn(`  countPendingContent failed:`, err);
      hadFatal = true;
    }

    totalGenerated += sourceGenerated;
  }

  console.log(`\nDone — total generated=${totalGenerated}`);
  process.exit(hadFatal ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
