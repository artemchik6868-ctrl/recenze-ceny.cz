/**
 * Minimal TerraLeads API probe (no app imports).
 * Usage: node scripts/terraleads-test-api.mjs [offer|ip] [--ipv4]
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const forceIpv4 = process.argv.includes("--ipv4");
const method = process.argv.includes("ip") ? "ip/get" : "offer/list";
const userId = Number(process.env.TERRALEADS_USER_ID);
const apiKey = process.env.TERRALEADS_API_KEY;

if (!userId || !apiKey) {
  console.error("Missing TERRALEADS_USER_ID or TERRALEADS_API_KEY in .env");
  process.exit(1);
}

const ip4 = await fetch("https://api.ipify.org", { signal: AbortSignal.timeout(8000) })
  .then((r) => r.text())
  .catch(() => "");
console.log(`caller_ipv4 (ipify): ${ip4.trim() || "(unknown)"}`);
console.log(`transport: ${forceIpv4 ? "forced IPv4 (direct t-api.org)" : "fetch default"}`);

const body = JSON.stringify({ user_id: userId, data: [] });
const check_sum = createHash("sha1").update(body + apiKey).digest("hex");
const [model, action] = method.split("/");
const path = `/api/${model}/${action}?check_sum=${check_sum}`;

async function postIpv4() {
  return new Promise((resolvePromise, reject) => {
    const req = https.request(
      {
        host: "104.21.57.171",
        servername: "t-api.org",
        path,
        method: "POST",
        family: 4,
        headers: {
          Host: "t-api.org",
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "recenze-ceny-test/1.0",
        },
      },
      (res) => {
        let text = "";
        res.on("data", (c) => (text += c));
        res.on("end", () => resolvePromise({ status: res.statusCode ?? 0, text }));
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const res = forceIpv4
  ? await postIpv4()
  : await fetch(`https://t-api.org${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "recenze-ceny-test/1.0",
      },
      body,
    }).then(async (r) => ({ status: r.status, text: await r.text() }));

console.log(`endpoint: ${method}`);
console.log(`HTTP ${res.status}`);
if (res.status === 403) {
  console.log("403 Forbidden — if ip/get works but offer/list fails, API access may be disabled on the account.");
}
let preview = res.text;
try {
  const json = JSON.parse(res.text);
  if (method === "offer/list" && json.status === "ok" && Array.isArray(json.data)) {
    const flat = json.data.reduce((n, p) => n + (p.offers?.length ?? 0), 0);
    const pl = json.data.flatMap((p) => p.offers ?? []).filter(
      (o) => String(o.country_code ?? "").toUpperCase() === "PL",
    );
    preview = JSON.stringify({
      status: json.status,
      products: json.data.length,
      flattened_offers: flat,
      pl_offers: pl.length,
      pl_active: pl.filter((o) => String(o.status ?? "").toLowerCase() === "active").length,
    });
  }
} catch {
  /* keep raw preview */
}
console.log(preview.slice(0, 800));

