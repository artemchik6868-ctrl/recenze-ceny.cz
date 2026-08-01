/**
 * Force-regen all active CPA.tl offers via prod backfill (landing facts live on worker).
 * Uses ai_limit=1 to stay inside Worker deadline.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs scripts/regen-cpa-tl-landing-facts-all.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env"), "utf8")
    .split(/\r?\n/)
    .flatMap((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) return [];
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return [[m[1].trim(), v]];
    }),
);

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "https://recenze-ceny.cz";
const MAX_ROUNDS = Number(
  process.argv.find((a) => a.startsWith("--max-rounds="))?.split("=")[1] ?? 50,
);
const TARGET = 36; // CZ landings count from feed
const secret = env.HOOK_SECRET;
if (!secret) throw new Error("HOOK_SECRET missing");

let totalGenerated = 0;
let totalFailed = 0;
const rounds = [];

for (let i = 1; i <= MAX_ROUNDS; i++) {
  const params = new URLSearchParams({
    secret,
    source: "cpa_tl",
    task: "ai",
    ai_limit: "1",
    force_regen: "1",
    deadline_ms: "90000",
  });
  const url = `${BASE}/api/public/hooks/backfill-content?${params}`;
  console.error(`\n=== round ${i}/${MAX_ROUNDS} generated_so_far=${totalGenerated} ===`);
  const started = Date.now();
  let json;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    const text = await res.text();
    json = JSON.parse(text);
    console.error(`status=${res.status} elapsed=${Date.now() - started}ms`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`FETCH FAIL: ${message}`);
    rounds.push({ round: i, ok: false, error: message });
    await new Promise((r) => setTimeout(r, 5000));
    continue;
  }

  const c = json?.cpa_tl?.content ?? {};
  const generated = Number(c.generated ?? 0);
  const failed = Number(c.failed ?? 0);
  const locked = Number(c.lockedSkipped ?? 0);
  const cooldown = Number(c.cooldownSkipped ?? 0);
  totalGenerated += generated;
  totalFailed += failed;
  rounds.push({
    round: i,
    ok: json?.ok === true,
    generated,
    failed,
    lockedSkipped: locked,
    cooldownSkipped: cooldown,
    elapsed_ms: json?.elapsed_ms ?? Date.now() - started,
    timedOut: json?.timedOut ?? false,
  });
  console.error(
    `generated=${generated} failed=${failed} locked=${locked} cooldown=${cooldown} totalGenerated=${totalGenerated}`,
  );

  if (totalGenerated >= TARGET) {
    console.error(`\nReached target ${TARGET} generations.`);
    break;
  }
  // If nothing moves for several rounds, stop.
  const recent = rounds.slice(-5);
  if (
    recent.length === 5 &&
    recent.every((r) => (r.generated ?? 0) === 0 && (r.failed ?? 0) === 0)
  ) {
    console.error("\nNo progress in last 5 rounds — stopping.");
    break;
  }
  await new Promise((r) => setTimeout(r, 1500));
}

mkdirSync(resolve(root, "scripts/out"), { recursive: true });
const outPath = resolve(root, "scripts/out/regen-cpa-tl-landing-facts-all.json");
writeFileSync(
  outPath,
  JSON.stringify({ totalGenerated, totalFailed, rounds }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ totalGenerated, totalFailed, rounds: rounds.length }, null, 2));
console.error(`Wrote ${outPath}`);
