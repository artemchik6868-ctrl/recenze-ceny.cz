import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const raw = readFileSync(resolve(root, ".env"), "utf8");
const env = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const slugs = [
  "obohrevatel-handy-heater-8583",
  "turetskaya-prostyn-s-podohrevom-10803",
  "vynylovyy-proyhryvatel-17801",
];

// Search product_content by partial match in display titles / all content rows
const { data: all } = await sb.from("product_content").select("source,offer_id,display_title_uk,display_title_ru,qa_status_uk,qa_status_ru,form_kind,title_uk,title_ru,meta_desc_uk,meta_desc_ru").limit(500);
console.log("total content rows:", all?.length ?? 0);

for (const slug of slugs) {
  const id = Number(slug.match(/-(\d+)$/)?.[1]);
  const hit = (all ?? []).find((r) => r.offer_id === id);
  console.log(`\n${slug} id=${id}`, hit ? JSON.stringify(hit, null, 2) : "no content row");
}

// grep titles
for (const term of ["Handy", "Yasam", "Волны", "обогрев", "простын", "проигрыв"]) {
  const hits = (all ?? []).filter((r) =>
    [r.display_title_uk, r.display_title_ru, r.title_uk, r.title_ru].some((t) => t && t.toLowerCase().includes(term.toLowerCase())),
  );
  if (hits.length) {
    console.log(`\nSearch "${term}":`, hits.map((h) => `${h.source}:${h.offer_id} ${h.display_title_ru || h.display_title_uk}`).join("\n"));
  }
}
