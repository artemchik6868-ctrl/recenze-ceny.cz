/** Drain active feed wave to completion via prod sync-daily hook. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const secret = env.HOOK_SECRET;
const base = env.SITE_URL || "https://recenze-ceny.cz";
if (!secret) {
  console.error("HOOK_SECRET missing");
  process.exit(1);
}

async function get(path, query = "") {
  const url = `${base}${path}?secret=${encodeURIComponent(secret)}${query ? `&${query}` : ""}`;
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(320_000) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, ms: Date.now() - started, json };
}

const log = [];
let failures = 0;

for (let i = 0; i < 25; i++) {
  const st = await get("/api/public/hooks/pipeline-status");
  const wave = st.json.feed_wave;
  if (!wave?.active) {
    console.log(`\nWave idle after ${i} drains. last_error=${wave?.last_error ?? "none"}`);
    break;
  }

  console.log(
    `\n#${i + 1} before: active=${wave.active_source ?? "-"} pending=[${(wave.pending ?? []).join(",")}]`,
  );
  const r = await get("/api/public/hooks/sync-daily");
  const u = r.json.unit ?? {};
  const line = {
    n: i + 1,
    http: r.status,
    ms: r.ms,
    source: u.source,
    ok: u.ok,
    done: u.done,
    waveDone: u.waveDone ?? r.json.wave?.waveDone,
    error: u.error ?? null,
    pending: u.pending?.length ?? r.json.remaining_work?.length,
  };
  log.push(line);
  console.log(JSON.stringify(line));
  if (u.ok === false) failures += 1;
  if (r.json.wave?.waveDone || u.waveDone) {
    console.log("waveDone=true");
    break;
  }
}

const final = await get("/api/public/hooks/pipeline-status");
console.log("\nFINAL feed_wave", JSON.stringify(final.json.feed_wave, null, 2));
console.log("alerts", final.json.alerts);
console.log(`failures=${failures} units=${log.length}`);
if (final.json.feed_wave?.active) process.exit(2);
if (failures > 1) process.exit(1);
