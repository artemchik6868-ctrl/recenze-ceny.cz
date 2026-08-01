/**
 * Regen each CPA.tl CZ-landing offer via smoke-landing-facts (LLM extract + generate).
 * Uses fixed offer_id list so every offer is hit once (unlike force_regen backfill).
 *
 *   node --import ./scripts/win-fetch-proxy.mjs scripts/regen-cpa-tl-landing-facts-by-id.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** All cpa_tl offers with CZ geo + CZ/CS landing (synced in DB). */
const IDS = [
  2685, 8917, 9177, 9178, 9181, 10739, 13070, 13631, 17769, 17811, 17818, 18531,
  18532, 18677, 19114, 19175, 19495, 19809, 20980, 21110, 21180, 21417, 21743,
  22853, 23135, 23334, 23351, 23352, 23353, 23354, 23355, 23409, 23419, 23632,
  23680, 23980,
];

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

function summarize(row) {
  const facts = row.landing?.facts;
  return {
    offerId: row.offerId,
    ok: row.ok === true,
    landingStatus: row.landing?.status ?? null,
    form: facts?.form ?? null,
    role: facts?.role ?? null,
    ingredients: facts?.ingredients?.length ?? 0,
    ingredientsSample: (facts?.ingredients ?? []).slice(0, 4),
    genStatus: row.generate?.status ?? null,
    hasSlozeni: row.generate?.hasSlozeni ?? false,
    displayTitle: row.generate?.displayTitle ?? null,
    htmlLen: row.generate?.htmlLen ?? 0,
    elapsed_ms: row.elapsed_ms ?? null,
    error: row.error ?? row.generate?.error ?? null,
  };
}

const results = [];
console.error(`CZ landing offers to regen: ${IDS.length}`);

for (let i = 0; i < IDS.length; i++) {
  const id = IDS[i];
  console.error(`\n=== ${i + 1}/${IDS.length} cpa_tl:${id} ===`);
  let row;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await runHook(id);
      row = summarize(raw);
      console.error(
        `ok=${row.ok} landing=${row.landingStatus} ingredients=${row.ingredients} gen=${row.genStatus} hasSlozeni=${row.hasSlozeni} ms=${row.elapsed_ms}`,
      );
      if (row.ingredientsSample?.length) {
        console.error(`  ingredients: ${row.ingredientsSample.join("; ")}`);
      }
      break;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`attempt ${attempt} FAIL: ${message}`);
      row = { offerId: id, ok: false, error: message };
      await new Promise((r) => setTimeout(r, 15_000 * attempt));
    }
  }
  results.push(row);
  // Space requests — combined landing LLM + generate is heavy on Worker CPU.
  await new Promise((r) => setTimeout(r, 8000));
}

const ok = results.filter((r) => r.ok).length;
const withIng = results.filter((r) => (r.ingredients ?? 0) > 0).length;
const withSlozeni = results.filter((r) => r.hasSlozeni).length;
const failed = results.filter((r) => !r.ok).map((r) => r.offerId);

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/regen-cpa-tl-landing-facts-by-id.json");
writeFileSync(
  outPath,
  JSON.stringify({ ok, withIng, withSlozeni, total: results.length, failed, results }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ ok, withIng, withSlozeni, total: results.length, failed }, null, 2));
console.error(`Wrote ${outPath}`);
