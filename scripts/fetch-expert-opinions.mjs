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

const keys = process.argv.slice(2).map((k) => {
  const [source, id] = k.split(":");
  return [source, Number(id)];
});

const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");

for (const [source, id] of keys) {
  const { data } = await supabaseAdmin
    .from("product_content")
    .select("display_title_uk,sections_uk")
    .eq("source", source)
    .eq("offer_id", id)
    .maybeSingle();
  const op = Array.isArray(data?.sections_uk)
    ? data.sections_uk.find((s) => s.heading === "expert_opinion")?.body
    : null;
  console.log(`--- ${source}:${id} ${data?.display_title_uk ?? ""}`);
  console.log(op || "(none)");
  console.log("");
}
