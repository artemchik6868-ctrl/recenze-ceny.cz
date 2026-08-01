/**
 * TerraLeads IP whitelist helper for the ES worker egress.
 *
 * TerraLeads 403 usually means the worker outbound IPv4 is not whitelisted in the
 * partner dashboard. Whitelist IPv4 only (remove IPv6 lines before Save).
 *
 * Usage:
 *   node scripts/terraleads-ip.mjs
 *   node scripts/terraleads-ip.mjs --base=https://product-reviews.farmserverfarmserver.workers.dev
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import jiti from "jiti";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const load = jiti(import.meta.url);
const { terraleadsApiPost, terraleadsPartnerIp } = load("../src/lib/terraleads-api.server.ts");

const baseArg = process.argv.find((a) => a.startsWith("--base="));
const workerBase =
  baseArg?.slice(7) ??
  process.env.PL_SYNC_BASE ??
  process.env.CZ_WORKERS_DEV_BASE ??
  "https://product-reviews.workers.dev";

async function localIpv4() {
  try {
    const t = await fetch("https://api.ipify.org", { signal: AbortSignal.timeout(8000) });
    return (await t.text()).trim();
  } catch {
    return "";
  }
}

async function workerTraceIp() {
  const url = workerBase.replace(/\/$/, "") + "/cdn-cgi/trace";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const text = await res.text();
    const m = text.match(/^ip=(.+)$/m);
    return m?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

async function terraleadsRegisteredIp() {
  const res = await terraleadsApiPost("ip", "get", []);
  return terraleadsPartnerIp(res.data);
}

console.log("=== TerraLeads API diagnostics ===\n");
console.log(`Worker base: ${workerBase}`);

const local = await localIpv4();
if (local) console.log(`This machine IPv4 (ipify):     ${local}`);

const traceIp = await workerTraceIp();
if (traceIp) console.log(`Worker /cdn-cgi/trace ip:    ${traceIp}`);

async function probe(model, method) {
  const { createHash } = await import("node:crypto");
  const userId = Number(process.env.TERRALEADS_USER_ID);
  const apiKey = process.env.TERRALEADS_API_KEY;
  const body = JSON.stringify({ user_id: userId, data: [] });
  const check_sum = createHash("sha1").update(body + apiKey).digest("hex");
  const url = `https://t-api.org/api/${model}/${method}?check_sum=${check_sum}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body,
  });
  return { label: `${model}/${method}`, status: res.status, text: await res.text() };
}

try {
  const tlIp = await terraleadsRegisteredIp();
  console.log(`TerraLeads ip/get partner IP:  ${tlIp ?? "(unknown)"}`);
} catch (err) {
  console.log(
    `TerraLeads ip/get failed: ${err instanceof Error ? err.message : err}`,
  );
}

console.log("\nEndpoint probe (from this machine):");
for (const [model, method] of [
  ["ip", "get"],
  ["stream", "list"],
  ["offer", "list"],
]) {
  try {
    const p = await probe(model, method);
    console.log(`  ${p.label.padEnd(14)} HTTP ${p.status}`);
  } catch (err) {
    console.log(`  ${model}/${method}`.padEnd(14), err instanceof Error ? err.message : err);
  }
}

console.log("\nNotes:");
console.log("  • Empty IP whitelist = API open from any IP (manager is correct).");
console.log("  • offer/list 403 while stream/list 200 = catalog API disabled on account.");
console.log("  • Ask manager to enable Offer API / offer list access for your user_id.");
console.log("  • PL offers also need PL streams in TerraLeads dashboard (stream/list had 0 PL).");
console.log("  • Set TERRALEADS_STREAM_ID to a PL stream id for lead/create.");
console.log("\nRetry sync: npm run sync:feeds (or node scripts/trigger-hook.mjs sync-terraleads)");
console.log("Full probe: node scripts/terraleads-test-api.mjs [--ipv4]");
