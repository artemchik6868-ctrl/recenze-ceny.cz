/**
 * Pause UptimeRobot monitor(s) for recenze-ceny health URL.
 * Primary uptime + free Telegram is HetrixTools (see setup-hetrixtools.mjs).
 * UptimeRobot Telegram/webhook are paid on Free — keep account paused to avoid duplicate noise.
 *
 * Usage:
 *   UPTIMEROBOT_API_KEY=... node scripts/pause-uptimerobot.mjs
 *   node scripts/pause-uptimerobot.mjs --id=803644390
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const env = {};
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
}

const apiKey = (process.env.UPTIMEROBOT_API_KEY || env.UPTIMEROBOT_API_KEY || "").trim();
const idArg = process.argv.find((a) => a.startsWith("--id="))?.slice(5);

if (!apiKey) {
  console.error("UPTIMEROBOT_API_KEY missing (env or .env)");
  process.exit(1);
}

async function post(method, fields = {}) {
  const body = new URLSearchParams({
    api_key: apiKey,
    format: "json",
    ...Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, v == null ? "" : String(v)]),
    ),
  });
  const res = await fetch(`https://api.uptimerobot.com/v2/${method}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json();
  if (!json || json.stat !== "ok") {
    throw new Error(`${method} failed: ${JSON.stringify(json)}`);
  }
  return json;
}

function normalizeUrl(u) {
  return String(u || "")
    .trim()
    .replace(/\/$/, "")
    .toLowerCase();
}

const { monitors } = await post("getMonitors", { logs: "0" });
const list = Array.isArray(monitors) ? monitors : [];

const targets = idArg
  ? list.filter((m) => String(m.id) === String(idArg))
  : list.filter((m) => {
      const u = normalizeUrl(m.url);
      return u.includes("recenze-ceny.cz");
    });

if (targets.length === 0) {
  console.log(JSON.stringify({ action: "none", message: "no matching monitors" }, null, 2));
  process.exit(0);
}

const paused = [];
for (const m of targets) {
  // status 0 = pause (UptimeRobot v2 editMonitor)
  await post("editMonitor", { id: m.id, status: 0 });
  paused.push({ id: m.id, friendly_name: m.friendly_name, url: m.url });
}

console.log(JSON.stringify({ action: "paused", monitors: paused }, null, 2));
