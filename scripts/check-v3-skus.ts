/** Spot-check v3 regen results in DB. Usage: npx tsx scripts/check-v3-skus.ts */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

const JOBS: [string, number][] = [
  ["adcombo", 33950],
  ["shakes", 21182],
  ["shakes", 21064],
  ["shakes", 15928],
  ["m1_top", 5482],
  ["shakes", 21956],
];

async function main(): Promise<void> {
  for (const [src, id] of JOBS) {
    const { data, error } = await supabaseAdmin
      .from("product_content")
      .select("display_title_uk, form_kind, qa_status_uk, description_html_uk")
      .eq("source", src)
      .eq("offer_id", id)
      .maybeSingle();
    if (error) console.log(`${src}:${id} error=${error.message}`);
    const html = (data?.description_html_uk ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
    console.log(`${src}:${id}`);
    console.log(`  qa=${data?.qa_status_uk} form=${data?.form_kind}`);
    console.log(`  title=${data?.display_title_uk}`);
    console.log(`  html=${html}`);
  }
}

main();
