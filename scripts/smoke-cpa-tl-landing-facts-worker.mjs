/**
 * Worker batch: CPA.tl LLM landing facts (full page) + force generate.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs scripts/smoke-cpa-tl-landing-facts-worker.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** Batch 2: Vermixin, Mystery Box, Laser Light, My Hero, Grass Trimmer */
const IDS = [9177, 22853, 17811, 23352, 19809];

function runHook(offerId) {
  return new Promise((resolvePromise, reject) => {
    const args = [
      "--import",
      "./scripts/win-fetch-proxy.mjs",
      "scripts/trigger-hook.mjs",
      "smoke-landing-facts",
      `--query=source=cpa_tl&offer_id=${offerId}&mode=llm`,
    ];
    const child = spawn("node", args, { cwd: root, shell: false });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.stderr.on("data", (d) => {
      err += d.toString();
      process.stderr.write(d);
    });
    child.on("close", (code) => {
      const text = out + "\n" + err;
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      let parsed = null;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        } catch {
          parsed = null;
        }
      }
      if (parsed) resolvePromise(parsed);
      else
        reject(
          new Error(
            `offer ${offerId} exit=${code} parse_fail stdout=${out.slice(0, 400)} stderr=${err.slice(0, 400)}`,
          ),
        );
    });
  });
}

const results = [];
for (const id of IDS) {
  console.error(`\n=== WORKER CPA.tl LLM smoke offer_id=${id} ===`);
  try {
    const row = await runHook(id);
    results.push(row);
    const facts = row.landing?.facts;
    console.error(
      `ok=${row.ok} landing=${row.landing?.status} promptTok=${row.landing?.usage?.prompt_tokens} form=${facts?.form} role=${facts?.role} ingredients=${facts?.ingredients?.length ?? 0} gen=${row.generate?.status} ms=${row.elapsed_ms}`,
    );
    if (facts?.ingredients?.length) {
      console.error(`  ingredients: ${facts.ingredients.join("; ")}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ ok: false, offerId: id, error: message });
    console.error(`FAILED ${id}: ${message}`);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/smoke-cpa-tl-landing-facts-worker.json");
writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
console.error(`\nWrote ${outPath}`);
