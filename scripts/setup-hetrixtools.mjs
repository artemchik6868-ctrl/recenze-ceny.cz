/**
 * Create (or reuse) a HetrixTools website monitor for /api/public/health.
 * Primary free uptime path — Telegram alerts are free on HetrixTools (their bot).
 *
 * Prerequisites (UI, once):
 *   1. Sign up at https://hetrixtools.com
 *   2. Contact Lists → add Telegram (start @HetrixTools bot, paste Chat ID)
 *   3. Copy API Key from API Keys
 *
 * Usage:
 *   HETRIXTOOLS_API_KEY=... node scripts/setup-hetrixtools.mjs
 *   node scripts/setup-hetrixtools.mjs --url=https://recenze-ceny.cz/api/public/health
 *   node scripts/setup-hetrixtools.mjs --contact-list=ID
 *
 * Env: HETRIXTOOLS_API_KEY (also .env). Never commit the key.
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

const apiKey = (process.env.HETRIXTOOLS_API_KEY || env.HETRIXTOOLS_API_KEY || "").trim();
const monitorUrl = (
  process.argv.find((a) => a.startsWith("--url="))?.slice(6) ||
  "https://recenze-ceny.cz/api/public/health"
).replace(/\/$/, "");
const name =
  process.argv.find((a) => a.startsWith("--name="))?.slice(7) || "recenze-ceny.cz health";
const contactListArg = process.argv.find((a) => a.startsWith("--contact-list="))?.slice(15);

if (!apiKey) {
  console.error("HETRIXTOOLS_API_KEY missing (env or .env)");
  console.error("Sign up → API Keys → then: HETRIXTOOLS_API_KEY=... node scripts/setup-hetrixtools.mjs");
  process.exit(1);
}

function normalizeUrl(u) {
  return String(u || "")
    .trim()
    .replace(/\/$/, "")
    .toLowerCase();
}

const target = normalizeUrl(monitorUrl);

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HetrixTools GET ${url} non-JSON HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return { http: res.status, json };
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HetrixTools POST non-JSON HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return { http: res.status, json };
}

console.log(`HetrixTools setup → ${monitorUrl}`);

async function listMonitorsV3() {
  const res = await fetch("https://api.hetrixtools.com/v3/uptime-monitors", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`v3 list monitors HTTP ${res.status}: ${JSON.stringify(json)}`);
  return Array.isArray(json?.monitors) ? json.monitors : [];
}

const monitors = await listMonitorsV3();
const existing = monitors.find((m) => {
  const t = normalizeUrl(m.target || m.Target || m.url || "");
  return t === target || t.includes("/api/public/health");
});

if (existing) {
  console.log(
    JSON.stringify(
      {
        action: "reuse",
        id: existing.id,
        name: existing.name,
        target: existing.target,
        contact_lists: existing.contact_lists,
        uptime_status: existing.uptime_status,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

// Resolve contact list — prefer one named Telegram (configured in Hetrix UI).
let contactList = (contactListArg || env.HETRIXTOOLS_CONTACT_LIST || "").trim();
if (!contactList) {
  const contactsUrl = `https://api.hetrixtools.com/v1/${encodeURIComponent(apiKey)}/contacts/`;
  try {
    const { json: contactsRes } = await getJson(contactsUrl);
    const lists = Array.isArray(contactsRes)
      ? contactsRes
      : Array.isArray(contactsRes?.contacts)
        ? contactsRes.contacts
        : Array.isArray(contactsRes?.result)
          ? contactsRes.result
          : [];
    console.log(
      "Contact lists:",
      lists.map((c) => `${c.Name || c.name}:${c.ID || c.id}`).join(", ") || "(none)",
    );
    const withTgName = lists.find((c) => /telegram/i.test(String(c.Name || c.name || "")));
    const withTgField = lists.find(
      (c) =>
        c.Telegram ||
        c.telegram ||
        (Array.isArray(c.Contacts) && c.Contacts.some((x) => /telegram/i.test(JSON.stringify(x)))),
    );
    const pick = withTgName || withTgField || (lists.length === 1 ? lists[0] : null);
    if (pick) contactList = String(pick.ID || pick.id || "");
    else if (lists.length > 1) {
      console.error("Multiple contact lists — pass --contact-list=ID (prefer Telegram list)");
      process.exit(1);
    }
  } catch (e) {
    console.warn("Could not list contacts:", e instanceof Error ? e.message : e);
  }
}

if (!contactList) {
  console.warn(
    "No ContactList ID — monitor will be created without alerts. Add Telegram in Hetrix UI, then re-run with --contact-list=ID",
  );
}

const payload = {
  Type: 1,
  Name: name,
  Target: monitorUrl,
  Timeout: 10,
  Frequency: 1,
  FailsBeforeAlert: 2,
  FailedLocations: "",
  ContactList: contactList || "",
  Category: "",
  AlertAfter: "",
  RepeatTimes: "",
  RepeatEvery: "",
  Public: false,
  ShowTarget: true,
  VerSSLCert: false,
  VerSSLHost: false,
  Method: "GET",
  Keyword: "ok",
  HTTPCodes: "200",
  MaxRedirects: "3",
  SSLExpiryReminder: "0",
  DomainExpiryReminder: "0",
  NSChangeAlert: "0",
  // Free plan: pick a few EU/nearby locations
  Locations: {
    nyc: false,
    sfo: false,
    dal: false,
    ams: true,
    lon: true,
    fra: true,
    sgp: false,
    syd: false,
    sao: false,
    tok: false,
    mba: false,
    waw: true,
  },
};

const addUrl = `https://api.hetrixtools.com/v2/${encodeURIComponent(apiKey)}/uptime/add/`;
const { http, json: created } = await postJson(addUrl, payload);

const ok =
  http < 400 &&
  (created?.status === "SUCCESS" ||
    created?.Status === "SUCCESS" ||
    created?.result === "SUCCESS" ||
    Boolean(created?.MonitorID || created?.monitor_id || created?.ID));

if (!ok) {
  console.error(JSON.stringify({ http, created }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      action: "created",
      name,
      url: monitorUrl,
      frequency_min: 1,
      keyword: "ok",
      contact_list: contactList || null,
      response: created,
    },
    null,
    2,
  ),
);
