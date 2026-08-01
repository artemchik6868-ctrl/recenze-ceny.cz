/**
 * Report shakes_landing_facts queue status.
 *
 *   node --import ./scripts/win-fetch-proxy.mjs ./node_modules/tsx/dist/cli.mjs scripts/landing-facts-queue-status.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1].trim()] = v;
}

const { createClient } = await import("@supabase/supabase-js");
const { pickAdaptiveLandingUrl, isClearlyCzLandingUrl, landingUrlHash } = await import(
  pathToFileURL(resolve(root, "src/lib/landing-facts.ts")).href
);

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data: offers, error: oErr } = await sb
  .from("shakes_offers")
  .select("offer_id, raw, is_active")
  .eq("is_active", true)
  .limit(500);
if (oErr) throw oErr;

const { data: facts, error: fErr } = await sb.from("shakes_landing_facts").select("*");
if (fErr) throw fErr;

const byId = new Map((facts ?? []).map((r: { offer_id: number }) => [r.offer_id, r]));
const statusCount: Record<string, number> = {};
for (const r of facts ?? []) {
  const s = (r as { status: string }).status;
  statusCount[s] = (statusCount[s] ?? 0) + 1;
}

let withCzAdaptive = 0;
let pending = 0;
let locked = 0;
let okInjectable = 0;
const now = Date.now();

for (const o of offers ?? []) {
  const id = Number((o as { offer_id: number }).offer_id);
  const raw = ((o as { raw?: unknown }).raw ?? {}) as {
    landings?: Array<{ type?: string; url?: string }>;
  };
  const url = pickAdaptiveLandingUrl(raw);
  if (!url || !isClearlyCzLandingUrl(url)) continue;
  withCzAdaptive += 1;
  const row = byId.get(id) as
    | {
        status: string;
        url_hash: string;
        locked_until: string | null;
        prompt_block: string | null;
      }
    | undefined;
  const hash = landingUrlHash(url);
  if (!row) {
    pending += 1;
    continue;
  }
  if (row.locked_until && new Date(row.locked_until).getTime() > now) {
    locked += 1;
  }
  if (row.status === "ok" && row.url_hash === hash) {
    if (row.prompt_block) okInjectable += 1;
    continue;
  }
  if (row.status === "no_url" || row.status === "skip_geo" || row.status === "exhausted") continue;
  if (row.url_hash !== hash || row.status === "thin" || row.status === "fetch_error") {
    if (!(row.locked_until && new Date(row.locked_until).getTime() > now)) pending += 1;
  }
}

console.log(
  JSON.stringify(
    {
      activeOffers: (offers ?? []).length,
      withCzAdaptive,
      factsRows: (facts ?? []).length,
      statusCount,
      pendingDrain: pending,
      lockedCooldown: locked,
      okWithPromptBlock: okInjectable,
    },
    null,
    2,
  ),
);
