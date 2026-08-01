/**
 * Loop backfill-content until AI generation settles to 0.
 * Usage: node scripts/run-backfill.mjs [--max-rounds=50] [--base=http://localhost:8080]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadHookSecret() {
  const envPath = resolve(root, ".env");
  const raw = readFileSync(envPath, "utf8");
  const m = raw.match(/^HOOK_SECRET=(?:"([^"]*)"|'([^']*)'|(\S+))/m);
  if (!m) throw new Error("HOOK_SECRET not found in .env");
  return m[1] ?? m[2] ?? m[3];
}

function sumStats(json) {
  let generated = 0;
  let processed = 0;
  let failed = 0;
  const sources = ["cpa_tl", "kma", "m1_top", "cpagetti", "adcombo", "shakes"];
  for (const src of sources) {
    const block = json[src];
    if (!block || typeof block !== "object") continue;
    const c = block.content;
    const i = block.images;
    if (c && typeof c === "object") {
      generated += Number(c.generated ?? 0);
      failed += Number(c.failed ?? 0);
    }
    if (i && typeof i === "object") {
      processed += Number(i.processed ?? 0);
      failed += Number(i.failed ?? 0);
    }
    const l = block.lcp;
    if (l && typeof l === "object") {
      processed += Number(l.processed ?? 0);
      failed += Number(l.failed ?? 0);
    }
  }
  return { generated, processed, failed };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const eq = raw.indexOf("=");
    if (eq !== -1) {
      args[raw.slice(2, eq)] = raw.slice(eq + 1);
      continue;
    }
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = "1";
    }
  }
  return args;
}
const args = parseArgs(process.argv.slice(2));
const maxRounds = Number(args["max-rounds"] ?? 50);
const base = args.base ?? "http://localhost:8080";
const source = args.source ?? "";
const task = args.task ?? "";
if (task === "img") {
  console.error("task=img removed — product images are partner hotlinks (no Storage resize/prewarm)");
  process.exit(1);
}
const aiLimit = args["ai-limit"] ?? "";
const lcpLimit = args["lcp-limit"] ?? args.lcp_limit ?? "";
if (lcpLimit) {
  console.error("lcp-limit removed — no LCP WebP resize/prewarm pipeline");
  process.exit(1);
}
const categorySlug = args["category-slug"] ?? args.category_slug ?? "";
const forceRegen = args["force-regen"] === "1" || args.force_regen === "1";
const regenFallback = args["regen-fallback"] === "1" || args.regen_fallback === "1";
const secret = loadHookSecret();
const params = new URLSearchParams({ secret });
if (source) params.set("source", source);
if (task) params.set("task", task);
if (aiLimit) params.set("ai_limit", aiLimit);
if (categorySlug) params.set("category_slug", categorySlug);
if (forceRegen) params.set("force_regen", "1");
if (regenFallback) params.set("regen_fallback", "1");
const url = `${base}/api/public/hooks/backfill-content?${params}`;

console.log(`Backfill → ${base} (max ${maxRounds} rounds)`);

async function fetchWithRetry(url, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, { method: "GET", signal: AbortSignal.timeout(120_000) });
    } catch (err) {
      lastErr = err;
      const wait = 3000 * (i + 1);
      console.warn(`  fetch failed (${err.cause?.code ?? err.message}), retry in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

for (let round = 1; round <= maxRounds; round++) {
  const started = Date.now();
  const res = await fetchWithRetry(url);
  const text = await res.text();
  if (!res.ok) {
    console.error(`Round ${round}: HTTP ${res.status} — ${text.slice(0, 200)}`);
    process.exit(1);
  }
  const json = JSON.parse(text);
  const { generated, processed, failed } = sumStats(json);
  const elapsed = json.elapsed_ms ?? Date.now() - started;
  console.log(
    `Round ${round}: generated=${generated} processed=${processed} failed=${failed} elapsed=${elapsed}ms timedOut=${json.timedOut ?? false}`,
  );
  for (const src of ["cpa_tl", "kma", "m1_top", "cpagetti"]) {
    if (json[src]) console.log(`  ${src}:`, JSON.stringify(json[src]));
  }
  if (generated === 0 && processed === 0 && failed === 0 && !json.timedOut) {
    console.log("Done — backlog cleared.");
    break;
  }
  if (processed === 0 && failed > 0) {
    console.log(`  (${failed} failed this round — retrying)`);
  }
  if (json.timedOut && generated === 0 && processed === 0) {
    console.log("  (timed out before work — retrying)");
  }
  if (round === maxRounds) {
    console.log(`Stopped after ${maxRounds} rounds — run again to continue.`);
  }
}
