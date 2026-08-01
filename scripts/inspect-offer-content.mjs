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

const offerId = 17091;
const source = "cpagetti";

const [offer, content, failure] = await Promise.all([
  sb.from("cpagetti_offers").select("offer_id,title,is_active,synced_at").eq("offer_id", offerId).maybeSingle(),
  sb
    .from("product_content")
    .select(
      "offer_id,display_title_uk,description_html_uk,faq_uk,generated_at,qa_status_uk,source_hash",
    )
    .eq("source", source)
    .eq("offer_id", offerId)
    .maybeSingle(),
  sb.from("content_gen_failures").select("*").eq("source", source).eq("offer_id", offerId).maybeSingle(),
]);

console.log(JSON.stringify({ offer: offer.data, content: content.data, failure: failure.data }, null, 2));
