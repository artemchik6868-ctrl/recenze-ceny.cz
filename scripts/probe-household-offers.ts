/**
 * One-off probe for household-trap Shakes offers.
 * Usage: npx tsx scripts/probe-household-offers.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPartnerClassifyBlob } from "../src/lib/partner-feed-text";
import { inferProductIntentSlug } from "../src/lib/product-intent.ro";
import { inferShakesLandingTokenSlug } from "../src/lib/shakes-landing-tokens.ro";
import { classifyTitleFirst } from "../src/lib/classify";

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

const ids = [16086, 17638, 17640, 18856, 18930];
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

for (const id of ids) {
  const { data } = await supabaseAdmin
    .from("shakes_offers")
    .select("offer_id, title, category, raw")
    .eq("offer_id", id)
    .maybeSingle();
  if (!data) {
    console.log(id, "NOT FOUND");
    continue;
  }
  const row = data as { offer_id: number; title: string; category: string | null; raw: unknown };
  const blob = buildPartnerClassifyBlob("shakes", row.raw, row.title, row.category);
  const intent = inferProductIntentSlug(row.title, undefined, blob);
  const token = inferShakesLandingTokenSlug(blob);
  const sync = classifyTitleFirst(row.title, blob, "other");
  console.log("---", id, row.title);
  console.log("category:", row.category);
  console.log("blob:", blob.slice(0, 280));
  console.log("token:", token, "intent:", intent, "sync:", sync);
}

const ids2 = [16086, 17638, 17640, 18856, 18930];
const { data: content } = await supabaseAdmin
  .from("product_content")
  .select("offer_id, display_title_uk")
  .eq("source", "shakes")
  .in("offer_id", ids2);
console.log("\n=== H1 check ===");
for (const id of ids2) {
  const row = (content ?? []).find((r) => (r as { offer_id: number }).offer_id === id) as
    | { offer_id: number; display_title_uk: string | null }
    | undefined;
  const h1 = row?.display_title_uk ?? "(no content)";
  const bad = /bun[aă]stare|uz casnic/i.test(h1);
  console.log(id, bad ? "BAD" : "OK", h1.slice(0, 90));
}
