import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

const { getOrGenerateProductContentDetailed, PIPELINE_VERSION } = await import(
  "../src/lib/ai-content.server.ts"
);
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

console.log(`${PIPELINE_VERSION} — regen Hondro Sol (cpagetti:15493)\n`);
const t0 = Date.now();
const gen = await getOrGenerateProductContentDetailed("cpagetti", 15493, "uk", "klouby", {
  forceRegen: true,
});
const { data } = await supabaseAdmin
  .from("product_content")
  .select("display_title_uk,description_html_uk,qa_status_uk,qa_reason_uk")
  .eq("source", "cpagetti")
  .eq("offer_id", 15493)
  .maybeSingle();

const html = data?.description_html_uk ?? "";
const blob = `${data?.display_title_uk ?? ""}${html}`;
console.log(`status: ${gen.status} ms: ${Date.now() - t0}`);
console.log(`title: ${data?.display_title_uk}`);
console.log(`qa: ${data?.qa_status_uk} | ${data?.qa_reason_uk}`);
console.log(`html_head: ${html.slice(0, 220)}`);
console.log(
  `sprej: ${/\bsprej\b/i.test(blob)} kapsle: ${/\bkapsl/i.test(blob)} doplnek: ${/dopln[eě]k stravy/i.test(html)}`,
);
console.log("url: https://recenze-ceny.cz/joint-care/hondro-g15493");
