/**
 * Diagnostic AI generation — no DB write, full QA per attempt.
 *
 * Usage:
 *   npm run debug:generate -- --source=cpa_tl --offer=21180
 *   npm run debug:generate -- --source=cpa_tl --offer=2976 --attempts=5 --save-json
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
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
  source: OfferSource;
  offerId: number;
  categorySlug: string | null;
  attempts: number;
  saveJson: boolean;
};

function parseArgs(argv: string[]): CliOpts {
  const out: CliOpts = {
    source: "cpa_tl",
    offerId: 0,
    categorySlug: null,
    attempts: 5,
    saveJson: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const eq = raw.indexOf("=");
    const key = eq !== -1 ? raw.slice(2, eq) : raw.slice(2);
    const val = eq !== -1 ? raw.slice(eq + 1) : argv[++i];
    switch (key) {
      case "source":
        out.source = val as OfferSource;
        break;
      case "offer":
        out.offerId = Number(val);
        break;
      case "category":
        out.categorySlug = val;
        break;
      case "attempts":
        out.attempts = Math.max(1, Number(val) || 5);
        break;
      case "save-json":
        out.saveJson = val === undefined || val === "1" || val === "true";
        break;
      default:
        break;
    }
  }
  return out;
}

function printReport(r: Awaited<ReturnType<typeof import("../src/lib/ai-content.server.ts")["debugGenerateOne"]>>): void {
  if (!r) {
    console.error("Offer not found or buildPromptSource failed");
    return;
  }
  console.log("\n--- Context ---");
  console.log(`source=${r.source} offer=${r.offerId} category=${r.categorySlug} pipeline=${r.pipelineVersion}`);
  console.log(`feedTitle: ${r.feedTitle}`);
  console.log(`cleaned (${r.cleanedDescription.length} chars): ${r.cleanedDescription.slice(0, 200)}…`);
  console.log(`facts.kind=${r.factsKind} displayTitle=${r.displayTitle}`);
  console.log(`maxAttempts=${r.maxAttempts} mode=${r.attempts[0]?.mode ?? "?"}`);

  for (const a of r.attempts) {
    console.log(`\n--- Attempt ${a.attempt} ---`);
    console.log(`mode=${a.mode}${a.retryFrom ? ` retryFrom=${a.retryFrom}` : ""}`);
    console.log(`promptLen=${a.promptLen} htmlLen=${a.htmlLen} qa=${a.qaSeverity}`);
    if (a.gatewayError) console.log(`gatewayError: ${a.gatewayError}`);
    if (a.qaErrors.length) console.log(`qaErrors: ${a.qaErrors.join(", ")}`);
    if (a.htmlPreview) console.log(`htmlPreview: ${a.htmlPreview.slice(0, 300)}…`);
  }

  console.log("\n--- Result ---");
  console.log(`finalOrigin=${r.finalOrigin} estimatedTier=${r.estimatedTier} finalHtmlLen=${r.finalHtmlLen}`);
  if (r.qaErrorsFinal.length) console.log(`qaErrorsFinal: ${r.qaErrorsFinal.join(", ")}`);
}

async function main(): Promise<void> {
  loadEnvIntoProcess();
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.offerId) {
    console.error("Usage: npm run debug:generate -- --source=cpa_tl --offer=21180 [--attempts=5] [--save-json]");
    process.exit(1);
  }
  if (!process.env.AI_API_KEY && !process.env.LOVABLE_API_KEY) {
    console.error("Missing AI_API_KEY or LOVABLE_API_KEY");
    process.exit(1);
  }

  const { debugGenerateOne } = await import("../src/lib/ai-content.server.ts");
  const { findOfferById } = await import("../src/lib/offers.server.ts");

  const offer = await findOfferById(opts.offerId);
  const categorySlug = opts.categorySlug ?? offer?.categorySlug ?? "other";

  console.log(`Debug generate ${opts.source}:${opts.offerId} (${categorySlug})…`);

  const result = await debugGenerateOne(opts.source, opts.offerId, categorySlug, {
    maxAttempts: opts.attempts,
  });

  printReport(result);

  if (opts.saveJson && result) {
    const outDir = resolve(__dirname, "out");
    mkdirSync(outDir, { recursive: true });
    const outPath = resolve(outDir, `debug-${opts.source}-${opts.offerId}.json`);
    writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
    console.log(`\nSaved ${outPath}`);
  }

  process.exit(result ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
