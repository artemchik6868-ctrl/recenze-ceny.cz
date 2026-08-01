/**
 * Regenerate joint-care shakes content where Hondrofrost (and similar) was
 * mislabeled as Kapseln due to partner bucket noise. Uses force_regen via
 * backfill hook — requires dev server on localhost:8080 (or --base=).
 *
 * Usage:
 *   node scripts/regen-joint-form-mismatch.mjs
 *   node scripts/regen-joint-form-mismatch.mjs --base=http://localhost:8080
 *   node scripts/regen-joint-form-mismatch.mjs --smoke-only
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

function parseArgs(argv) {
  const args = { smokeOnly: false, base: "http://localhost:8080" };
  for (const raw of argv) {
    if (raw === "--smoke-only") args.smokeOnly = true;
    else if (raw.startsWith("--base=")) args.base = raw.slice(7);
  }
  return args;
}

const SMOKE_SLUGS = [
  "joint-care/hondrofrost-s8861",
  "joint-care/hondrofrost-s12081",
  "joint-care/hondrofrost-s13181",
];

const env = loadEnv();
const args = parseArgs(process.argv.slice(2));
const secret = env.HOOK_SECRET;
if (!secret && !args.smokeOnly) {
  console.error("HOOK_SECRET missing in .env");
  process.exit(1);
}

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function listMismatchedOffers() {
  const { data: offers, error } = await sb
    .from("shakes_offers")
    .select("offer_id,title,is_active")
    .eq("is_active", true)
    .ilike("title", "%hondrofrost%");
  if (error) throw error;

  const ids = (offers ?? []).map((o) => o.offer_id);
  if (ids.length === 0) return [];

  const { data: content, error: cErr } = await sb
    .from("product_content")
    .select("offer_id,display_title_uk,form_kind")
    .eq("source", "shakes")
    .in("offer_id", ids);
  if (cErr) throw cErr;

  const { data: briefs } = await sb
    .from("product_briefs")
    .select("offer_id,pipeline_version")
    .eq("source", "shakes")
    .in("offer_id", ids);

  const briefById = new Map((briefs ?? []).map((r) => [r.offer_id, r]));
  const byId = new Map((content ?? []).map((r) => [r.offer_id, r]));
  const mismatched = [];
  for (const o of offers ?? []) {
    const c = byId.get(o.offer_id);
    const b = briefById.get(o.offer_id);
    const titleUk = c?.display_title_uk ?? "";
    const hasKapseln = /kapseln/i.test(titleUk);
    const oralForm = c?.form_kind === "capsules" || c?.form_kind === "tablets";
    if (hasKapseln || oralForm) {
      mismatched.push({
        offer_id: o.offer_id,
        feedTitle: o.title,
        display_title_uk: titleUk,
        form_kind: c?.form_kind ?? null,
        pipeline_version: b?.pipeline_version ?? null,
      });
    }
  }
  return mismatched;
}

async function fetchWithRetry(url, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw lastErr;
}

async function regenOfferIds(ids) {
  let totalGenerated = 0;
  for (const id of ids) {
    console.log(`\nRegenerating shakes offer ${id} ...`);
    const params = new URLSearchParams({
      secret,
      source: "shakes",
      task: "ai",
      force_regen: "1",
      category_slug: "klouby",
      offer_ids: String(id),
      ai_limit: "1",
      deadline_ms: "120000",
    });
    const json = await fetchWithRetry(`${args.base}/api/public/hooks/backfill-content?${params}`);
    const block = json.shakes?.content;
    const generated = block?.generated ?? 0;
    const failed = block?.failed ?? 0;
    totalGenerated += generated;
    console.log(`  gen=${generated} fail=${failed} checked=${block?.checked ?? "?"}`);
  }
  return totalGenerated;
}

async function smokeCheck(baseUrl) {
  console.log("\n=== Smoke check (H1 should contain Gelenkgel, not Kapseln) ===");
  for (const path of SMOKE_SLUGS) {
    const url = `${baseUrl.replace(/\/$/, "")}/${path}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      const html = await res.text();
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const h1 = h1Match?.[1]?.trim() ?? "(no h1)";
      const ok = /gelenkgel|gelenkcreme|gelenk gel/i.test(h1) && !/kapseln/i.test(h1);
      console.log(`${ok ? "OK" : "FAIL"} ${path}`);
      console.log(`  H1: ${h1}`);
    } catch (err) {
      console.log(`FAIL ${path}: ${err.message}`);
    }
  }
}

const mismatched = await listMismatchedOffers();
console.log(`Found ${mismatched.length} Hondrofrost shakes with Kapseln/oral form_kind:`);
for (const row of mismatched) {
  console.log(
    `  s${row.offer_id}: «${row.display_title_uk || "(no content)"}» form=${row.form_kind ?? "?"}`,
  );
}

if (args.smokeOnly) {
  const site = env.SITE_URL || "https://recenze-ceny.cz";
  await smokeCheck(site);
  process.exit(0);
}

console.log(`\nRunning targeted force_regen (shakes / joint-care) against ${args.base} ...`);
const total = await regenOfferIds(mismatched.map((r) => r.offer_id));
console.log(`\nDone. Total generated this run: ${total}`);

const after = await listMismatchedOffers();
console.log(`Remaining mismatches: ${after.length}`);

await smokeCheck(env.SITE_URL || "https://recenze-ceny.cz");
