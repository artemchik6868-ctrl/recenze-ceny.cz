/**
 * Offline blog ingest CLI — RSS → LLM rewrite → Supabase.
 *
 * Usage:
 *   npx tsx scripts/blog-ingest.ts
 *   npx tsx scripts/blog-ingest.ts --limit=2 --draft
 *   npx tsx scripts/blog-ingest.ts --dry-run
 *
 * Requires .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   AI_API_KEY or OPENROUTER_API_KEY (optional AI_GATEWAY_URL, BLOG_AI_MODEL, BLOG_AI_MODELS).
 *
 * Exit codes:
 *   0 — inserted >= 1, or inserted=0 with only skips (dry feed day)
 *   1 — inserted=0 with LLM/feed errors, or fatal crash
 *
 * Writes .blog-ingest-result.json for CI / Telegram notify.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runBlogIngest } from "../src/lib/blog-ingest.server";
import type { BlogPostStatus } from "../src/lib/blog";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const RESULT_PATH = resolve(root, ".blog-ingest-result.json");

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

type CliOpts = {
  limit: number;
  dryRun: boolean;
  status: BlogPostStatus;
};

function parseArgs(argv: string[]): CliOpts {
  const out: CliOpts = {
    limit: 3,
    dryRun: false,
    status: "published",
  };
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const eq = raw.indexOf("=");
    const key = eq === -1 ? raw.slice(2) : raw.slice(2, eq);
    const val = eq === -1 ? "1" : raw.slice(eq + 1);
    if (key === "limit") out.limit = Math.max(1, Number(val) || 3);
    if (key === "dry-run" || key === "dryRun") out.dryRun = true;
    if (key === "draft") out.status = "draft";
    if (key === "status" && (val === "draft" || val === "published" || val === "rejected")) {
      out.status = val;
    }
  }
  return out;
}

function writeResult(result: {
  scanned: number;
  inserted: number;
  skipped: number;
  errors: string[];
  slugs: string[];
}): void {
  try {
    writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2), "utf8");
  } catch (e) {
    console.warn("[blog-ingest] could not write result file:", e);
  }
}

async function main(): Promise<void> {
  loadEnvIntoProcess();
  const opts = parseArgs(process.argv.slice(2));
  console.log(
    `[blog-ingest] start limit=${opts.limit} status=${opts.status} dryRun=${opts.dryRun}`,
  );
  const result = await runBlogIngest(opts);
  writeResult(result);
  console.log(
    `[blog-ingest] done scanned=${result.scanned} inserted=${result.inserted} skipped=${result.skipped} errors=${result.errors.length}`,
  );
  if (result.slugs.length) console.log(`[blog-ingest] slugs: ${result.slugs.join(", ")}`);
  if (result.errors.length) {
    for (const e of result.errors.slice(0, 10)) console.warn(`  - ${e}`);
  }

  if (result.inserted >= 2) {
    console.log("[blog-ingest] ok: daily target met (>=2)");
    return;
  }
  if (result.inserted === 1) {
    console.warn("[blog-ingest] warning: only 1 post inserted (target 2–3)");
    return;
  }
  // inserted === 0
  if (result.errors.length > 0) {
    console.error("[blog-ingest] fail: 0 inserted with errors");
    process.exitCode = 1;
    return;
  }
  console.warn("[blog-ingest] warning: 0 inserted (dry day — title filter / duplicates only)");
}

main().catch((e) => {
  console.error(e);
  writeResult({ scanned: 0, inserted: 0, skipped: 0, errors: [String(e)], slugs: [] });
  process.exit(1);
});
