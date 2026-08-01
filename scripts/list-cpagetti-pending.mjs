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

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: offers } = await sb
  .from("cpagetti_offers")
  .select("offer_id,title,synced_at")
  .eq("is_active", true);

const { data: content } = await sb
  .from("product_content")
  .select("offer_id,display_title_uk,description_html_uk,faq_uk")
  .eq("source", "cpagetti");

const complete = new Set();
const haveRow = new Set();
for (const r of content ?? []) {
  haveRow.add(r.offer_id);
  const faqLen = Array.isArray(r.faq_uk) ? r.faq_uk.length : 0;
  if (r.display_title_uk && r.description_html_uk && faqLen >= 3) complete.add(r.offer_id);
}

const pending = (offers ?? [])
  .filter((o) => !complete.has(o.offer_id))
  .map((o) => ({
    offer_id: o.offer_id,
    title: o.title,
    synced_at: o.synced_at,
    bare: !haveRow.has(o.offer_id),
  }))
  .sort((a, b) => String(b.synced_at).localeCompare(String(a.synced_at)));

console.log(`pending=${pending.length} complete=${complete.size}`);
console.log(pending.slice(0, 15));
