/**
 * Create or align an UptimeRobot monitor for /api/public/health.
 *
 * Usage:
 *   UPTIMEROBOT_API_KEY=... node scripts/setup-uptimerobot.mjs
 *   node scripts/setup-uptimerobot.mjs --url=https://recenze-ceny.cz/api/public/health
 *
 * Env: UPTIMEROBOT_API_KEY (also read from .env). Never commit the key.
 *
 * Free-plan note: newMonitor via API often returns access_denied; in that case we
 * retarget an existing HTTP monitor for the same host to the health URL.
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
const monitorUrl = (
  process.argv.find((a) => a.startsWith("--url="))?.slice(6) ||
  "https://recenze-ceny.cz/api/public/health"
).replace(/\/$/, "");
const friendlyName =
  process.argv.find((a) => a.startsWith("--name="))?.slice(7) || "recenze-ceny.cz health";

if (!apiKey) {
  console.error("UPTIMEROBOT_API_KEY missing (env or .env)");
  process.exit(1);
}

const API = "https://api.uptimerobot.com/v2";

async function post(method, fields = {}) {
  const body = new URLSearchParams({
    api_key: apiKey,
    format: "json",
    ...Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, v == null ? "" : String(v)]),
    ),
  });
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => null);
  if (!json) {
    throw new Error(`${method} HTTP ${res.status}: empty body`);
  }
  return { http: res.status, json };
}

function normalizeUrl(u) {
  return String(u || "")
    .trim()
    .replace(/\/$/, "")
    .toLowerCase();
}

function hostOf(u) {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return "";
  }
}

const target = normalizeUrl(monitorUrl);
const targetHost = hostOf(monitorUrl);

console.log(`UptimeRobot setup → ${monitorUrl}`);

const { json: monitorsRes } = await post("getMonitors", { logs: "0" });
if (monitorsRes.stat !== "ok") {
  throw new Error(`getMonitors failed: ${JSON.stringify(monitorsRes)}`);
}
const monitors = Array.isArray(monitorsRes.monitors) ? monitorsRes.monitors : [];
const existingExact = monitors.find((m) => normalizeUrl(m.url) === target);

if (existingExact) {
  console.log(
    JSON.stringify(
      {
        action: "reuse",
        id: existingExact.id,
        friendly_name: existingExact.friendly_name,
        url: existingExact.url,
        type: existingExact.type,
        status: existingExact.status,
        interval: existingExact.interval,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const { json: contactsRes } = await post("getAlertContacts");
const contacts =
  contactsRes.stat === "ok" && Array.isArray(contactsRes.alert_contacts)
    ? contactsRes.alert_contacts
    : [];
const active = contacts.filter((c) => Number(c.status) === 2 || Number(c.status) === 1);
const alertContacts = active.map((c) => `${c.id}_0_0`).join("-");

console.log(
  `alert_contacts: ${
    active.length
      ? active.map((c) => `${c.friendly_name || c.type}#${c.id}`).join(", ")
      : "(none — add in UptimeRobot UI)"
  }`,
);

async function tryCreate(fields) {
  const { http, json } = await post("newMonitor", fields);
  return { http, json };
}

const createBase = {
  friendly_name: friendlyName,
  url: monitorUrl,
  interval: 300,
};
if (alertContacts) createBase.alert_contacts = alertContacts;

// Prefer keyword monitor; fall back to plain HTTP(S).
let created = await tryCreate({
  ...createBase,
  type: 2,
  keyword_type: 1,
  keyword_value: "ok",
});
if (created.json.stat !== "ok") {
  console.warn(`keyword newMonitor: ${created.json.error?.message || JSON.stringify(created.json)}`);
  created = await tryCreate({ ...createBase, type: 1 });
}

if (created.json.stat === "ok") {
  console.log(
    JSON.stringify(
      {
        action: "created",
        id: created.json.monitor?.id,
        friendly_name: friendlyName,
        url: monitorUrl,
        interval: 300,
        alert_contacts: alertContacts || null,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.warn(`newMonitor denied: ${created.json.error?.message || JSON.stringify(created.json)}`);

// Free plan often blocks API create — retarget an existing monitor on the same host.
const sameHost = monitors.find((m) => hostOf(m.url) === targetHost);
if (!sameHost) {
  console.error(
    "No existing monitor to retarget. Create one HTTP(S) monitor in the UptimeRobot UI, then re-run this script.",
  );
  process.exit(1);
}

const editFields = {
  id: sameHost.id,
  friendly_name: friendlyName,
  url: monitorUrl,
  interval: 300,
};
if (alertContacts) editFields.alert_contacts = alertContacts;

const { json: edited } = await post("editMonitor", editFields);
if (edited.stat !== "ok") {
  throw new Error(`editMonitor failed: ${JSON.stringify(edited)}`);
}

console.log(
  JSON.stringify(
    {
      action: "retargeted",
      id: sameHost.id,
      previous_url: sameHost.url,
      url: monitorUrl,
      friendly_name: friendlyName,
      interval: 300,
      note: "Free plan blocked newMonitor; retargeted existing monitor to health endpoint",
      alert_contacts: alertContacts || null,
    },
    null,
    2,
  ),
);
