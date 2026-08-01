/**
 * Worker smoke batch for image-facts (Phase 2).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs scripts/smoke-image-facts-worker.mjs
 *   node --import ./scripts/win-fetch-proxy.mjs scripts/smoke-image-facts-worker.mjs --ids=12889,6272,10314
 *   ... --force=1  (re-run LLM even if cached ok)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(m[1].trim() in process.env) || process.env[m[1].trim()] === "") {
        process.env[m[1].trim()] = v;
      }
    }
  } catch {
    /* optional */
  }
}
loadEnv();

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

/** Multi-source pairs: source:id */
const DEFAULT_PAIRS = [
  "shakes:12889",
  "m1_top:6272",
  "kma:10314",
  "cpa_tl:23680",
  "shakes:12197", // cache-hit check (already ok from Phase 1)
];

const force = arg("force") === "1" || process.argv.includes("--force");
const pairsArg = arg("pairs");
const pairs = (pairsArg
  ? pairsArg.split(",")
  : DEFAULT_PAIRS
).map((p) => p.trim()).filter(Boolean);

function runHook(source, offerId) {
  return new Promise((resolvePromise, reject) => {
    const q = `source=${source}&offer_id=${offerId}${force ? "&force=1" : ""}`;
    const args = [
      "--import",
      "./scripts/win-fetch-proxy.mjs",
      "scripts/trigger-hook.mjs",
      "smoke-image-facts",
      `--query=${q}`,
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
            `${source}:${offerId} exit=${code} parse_fail stdout=${out.slice(0, 400)} stderr=${err.slice(0, 400)}`,
          ),
        );
    });
  });
}

const results = [];
for (const pair of pairs) {
  const [source, idStr] = pair.split(":");
  const offerId = Number(idStr);
  console.error(`\n=== WORKER image-facts ${source}:${offerId} force=${force} ===`);
  try {
    const row = await runHook(source, offerId);
    results.push(row);
    const cached = row.timing && row.timing.llmMs === 0 && row.timing.preflightMs === 0;
    console.error(
      `ok=${row.ok} status=${row.status} method=${row.method} cached=${cached} tokens=${row.usage?.total_tokens ?? 0} ms=${row.elapsed_ms} err=${row.error ?? "-"}`,
    );
    if (row.facts) {
      console.error(
        `  type=${row.facts.productType} app=${row.facts.application} form=${row.facts.releaseForm} pack=${row.facts.packaging}`,
      );
      if (row.facts.briefDescription) console.error(`  desc=${row.facts.briefDescription}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ ok: false, source, offerId, error: message });
    console.error(`FAILED ${source}:${offerId}: ${message}`);
  }
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = resolve(root, `scripts/out/smoke-image-facts-worker-${stamp}.json`);
writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results, null, 2));
console.error(`\nWrote ${outPath}`);
