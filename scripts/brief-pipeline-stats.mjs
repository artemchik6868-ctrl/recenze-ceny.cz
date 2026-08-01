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

const PV = "v69-ro-niapept-form-hint";
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { count: briefsTotal } = await sb.from("product_briefs").select("*", { count: "exact", head: true });
const { count: briefsCurrent } = await sb
  .from("product_briefs")
  .select("*", { count: "exact", head: true })
  .eq("pipeline_version", PV);
const { data: content } = await sb
  .from("product_content")
  .select("offer_id,source,generated_at,display_title_uk,description_html_uk,faq_uk")
  .not("description_html_uk", "is", null);

const complete = (content ?? []).filter((r) => {
  const faq = Array.isArray(r.faq_uk) ? r.faq_uk.length : 0;
  return r.display_title_uk && r.description_html_uk && faq >= 3;
});

const byDay = {};
for (const r of complete) {
  const day = String(r.generated_at ?? "").slice(0, 10) || "unknown";
  byDay[day] = (byDay[day] ?? 0) + 1;
}

const today = complete.filter((r) => String(r.generated_at ?? "").startsWith("2026-07-08"));

console.log(
  JSON.stringify(
    {
      pipeline_version: PV,
      product_briefs_total: briefsTotal,
      product_briefs_on_current_pipeline: briefsCurrent,
      product_briefs_stale: (briefsTotal ?? 0) - (briefsCurrent ?? 0),
      complete_content_rows: complete.length,
      generated_today_2026_07_08: today.length,
      generated_by_day: byDay,
    },
    null,
    2,
  ),
);
