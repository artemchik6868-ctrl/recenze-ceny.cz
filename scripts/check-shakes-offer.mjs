import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { MARKET_GEO } from "../src/lib/market.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const offerId = Number(process.argv[2] ?? "21256");
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await sb
  .from("shakes_offers")
  .select("offer_id,title,is_active,raw,synced_at")
  .eq("offer_id", offerId)
  .maybeSingle();
if (error) {
  console.error(error);
  process.exit(1);
}

console.log("=== Shakes offer", offerId, "===");
if (!data) {
  console.log("NOT FOUND in shakes_offers");
  process.exit(1);
}

const raw = data.raw ?? {};
const plGoal = (raw.goals ?? []).find((g) => String(g.geo ?? "").toUpperCase() === MARKET_GEO);
const displayPrice = (() => {
  const goalLanding = plGoal?.landing_price != null ? Number(plGoal.landing_price) : NaN;
  if (Number.isFinite(goalLanding) && goalLanding > 0) {
    return { price: Math.round(goalLanding), source: "goals[PL].landing_price" };
  }
  const landing = raw.landing_price != null ? Number(raw.landing_price) : NaN;
  if (Number.isFinite(landing) && landing > 0) {
    return { price: Math.round(landing), source: "landing_price" };
  }
  return { price: null, source: "none" };
})();

console.log("title:", data.title);
console.log("is_active:", data.is_active);
console.log("synced_at:", data.synced_at);
console.log("raw.landing_price:", raw.landing_price);
console.log("goals[PL]:", plGoal);
if (plGoal?.cost != null) {
  console.log("goals[PL].cost (webmaster only, NOT storefront):", plGoal.cost, plGoal.currency ?? "");
}
console.log("computed display price (priceEUR field):", displayPrice.price, displayPrice.price != null ? "€" : "null");
console.log("source:", displayPrice.source);

const { data: offers } = await sb
  .from("shakes_offers")
  .select("offer_id,title,raw")
  .eq("is_active", true)
  .order("offer_id");
console.log("\nActive shakes offers:", offers?.length ?? 0);
