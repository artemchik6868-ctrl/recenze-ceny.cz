/**
 * Worker batch: LLM landing facts + force generate via smoke-landing-facts?mode=llm
 *
 *   node --import ./scripts/win-fetch-proxy.mjs scripts/smoke-landing-facts-worker-batch.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IDS = [14211, 14771, 15054, 16266, 16376, 16402, 17156, 17350, 17620, 13905];

function runHook(offerId) {
  return new Promise((resolvePromise, reject) => {
    const args = [
      "--import",
      "./scripts/win-fetch-proxy.mjs",
      "scripts/trigger-hook.mjs",
      "smoke-landing-facts",
      `--query=offer_id=${offerId}&mode=llm`,
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
  console.error(`\n=== WORKER LLM smoke offer_id=${id} ===`);
  try {
    const row = await runHook(id);
    results.push(row);
    console.error(
      `ok=${row.ok} landing=${row.landing?.status} form=${row.landing?.facts?.form} role=${row.landing?.facts?.role} gen=${row.generate?.status} ms=${row.elapsed_ms} slozeni=${row.generate?.hasSlozeni}`,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ ok: false, offerId: id, error: message });
    console.error(`FAILED ${id}: ${message}`);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/smoke-landing-facts-worker-llm-batch4.json");
writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
console.error(`\nWrote ${outPath}`);
