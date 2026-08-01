/**
 * Trace production generate path — full LLM HTML + resolveBody decision.
 * Usage: npx tsx scripts/trace-generate.ts --source=cpa_tl --offer=21180 [--runs=3]
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OfferSource } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  const key = m[1].trim();
  if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
}

const source = (process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ?? "cpa_tl") as OfferSource;
const offerId = Number(process.argv.find((a) => a.startsWith("--offer="))?.split("=")[1] ?? "21180");
const runs = Number(process.argv.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? "1");
const save = process.argv.includes("--save");

const { traceProductionGenerate } = await import("../src/lib/ai-content.server.ts");
const { findOfferById } = await import("../src/lib/offers.server.ts");

const offer = await findOfferById(offerId);
const categorySlug = offer?.categorySlug ?? "klouby";

const outDir = resolve(root, "scripts/out");
if (save) mkdirSync(outDir, { recursive: true });

for (let run = 1; run <= runs; run++) {
  console.log(`\n${"=".repeat(70)}\nRUN ${run}/${runs} — ${source}:${offerId}\n${"=".repeat(70)}`);
  const t = await traceProductionGenerate(source, offerId, categorySlug);
  if (!t) {
    console.error("trace failed");
    continue;
  }

  console.log(`pipeline=${t.pipelineVersion} maxAttempts=${t.maxAttempts}`);
  console.log(`displayTitle=${t.displayTitle}`);
  console.log(`genWithValidationOrigin=${t.genWithValidationOrigin}`);

  for (const a of t.attempts) {
    console.log(`\n--- Attempt ${a.attempt} ---`);
    console.log(`promptLen=${a.promptLen} loopExit=${a.loopExit}`);
    if (a.gatewayError) console.log(`GATEWAY ERROR: ${a.gatewayError}`);
    console.log(`raw title/subtitle/meta len: ${a.rawFields.title.length}/${a.rawFields.subtitle.length}/${a.rawFields.meta_desc.length}`);
    console.log(`description_html len: ${a.htmlLen}`);
    console.log(`QA: ${a.qaSeverity} → ${a.qaErrors.join(", ") || "none"}`);
    console.log(`\nFULL HTML (${a.htmlLen} chars):\n${a.htmlFull || "(empty)"}`);
    if (save && a.htmlFull) {
      const p = resolve(outDir, `trace-${source}-${offerId}-run${run}-attempt${a.attempt}.html`);
      writeFileSync(p, a.htmlFull, "utf8");
      console.log(`\nSaved ${p}`);
    }
  }

  console.log(`\n--- resolveBody (what gets saved to DB) ---`);
  console.log(`tier=${t.resolveBody.tier} qaReason=${t.resolveBody.qaReason}`);
  console.log(`htmlLen=${t.resolveBody.htmlLen} source=${t.resolveBody.source}`);
  console.log(`preview:\n${t.resolveBody.htmlPreview}…`);

  if (t.attempts[0] && t.resolveBody.source !== "ai_package") {
    const aiLen = t.attempts[0].htmlLen;
    console.log(`\n*** WHY NOT AI: attempt htmlLen=${aiLen}, need >=400 for resolveBody tier ai`);
    if (t.attempts[0].loopExit === "return_ai" && aiLen < 400) {
      console.log("→ QA passed (non-critical) but HTML too short → supplement-fallback template substituted");
    }
    if (t.attempts[0].gatewayError) {
      console.log(`→ Gateway error: ${t.attempts[0].gatewayError}`);
    }
    if (t.attempts[0].loopExit === "retry_critical" || t.attempts[0].loopExit === "exhausted_qa_fallback") {
      console.log("→ QA critical failures exhausted → qa-fallback or template");
    }
  }
}
