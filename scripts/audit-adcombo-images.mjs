/**
 * Audit AdCombo picture_url values — how many are missing or return non-image HTTP.
 * Usage: node scripts/audit-adcombo-images.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const CONCURRENCY = 8;
const TIMEOUT_MS = 12_000;

function isImageContentType(ct) {
  if (!ct) return false;
  const t = ct.toLowerCase();
  return t.startsWith("image/") || t.includes("octet-stream");
}

async function checkUrl(url) {
  if (!url?.trim()) return { status: "empty" };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "recenze-ceny-audit/1.0" },
    });
    clearTimeout(timer);
    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok) return { status: "http_error", code: res.status, contentType: ct };
    if (!isImageContentType(ct)) return { status: "not_image", code: res.status, contentType: ct };
    return { status: "ok", code: res.status, contentType: ct };
  } catch (err) {
    return { status: "fetch_error", message: err instanceof Error ? err.message : String(err) };
  }
}

async function runPool(items, fn) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()));
  return out;
}

const { data: offers, error } = await sb
  .from("adcombo_offers")
  .select("offer_id, title, picture_url")
  .eq("is_active", true)
  .order("offer_id");

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Checking ${offers.length} active AdCombo offers...\n`);

const results = await runPool(offers, async (row) => {
  const check = await checkUrl(row.picture_url);
  return { ...row, check };
});

const counts = {
  ok: 0,
  empty: 0,
  http_error: 0,
  not_image: 0,
  fetch_error: 0,
};
const httpCodes = {};
const broken = [];

for (const r of results) {
  counts[r.check.status] = (counts[r.check.status] ?? 0) + 1;
  if (r.check.status === "http_error") {
    const code = r.check.code ?? 0;
    httpCodes[code] = (httpCodes[code] ?? 0) + 1;
    broken.push(r);
  } else if (r.check.status === "empty" || r.check.status === "not_image" || r.check.status === "fetch_error") {
    broken.push(r);
  }
}

const brokenTotal = broken.length;
const pct = offers.length ? ((brokenTotal / offers.length) * 100).toFixed(1) : "0";

console.log("Summary:");
console.log(`  total active:     ${offers.length}`);
console.log(`  ok:               ${counts.ok}`);
console.log(`  empty URL:        ${counts.empty}`);
console.log(`  HTTP error:       ${counts.http_error}  ${JSON.stringify(httpCodes)}`);
console.log(`  not image (HTML): ${counts.not_image}`);
console.log(`  fetch timeout:    ${counts.fetch_error}`);
console.log(`  broken total:     ${brokenTotal} (${pct}%)\n`);

if (broken.length > 0) {
  console.log("Broken / missing (first 30):");
  for (const r of broken.slice(0, 30)) {
    const detail =
      r.check.status === "http_error"
        ? `HTTP ${r.check.code}`
        : r.check.status === "not_image"
          ? `not-image: ${r.check.contentType}`
          : r.check.status === "fetch_error"
            ? r.check.message
            : "empty URL";
    console.log(`  ${r.offer_id}\t${r.title}\t${detail}`);
    if (r.picture_url) console.log(`    ${r.picture_url}`);
  }
  if (broken.length > 30) console.log(`  ... and ${broken.length - 30} more`);
}
