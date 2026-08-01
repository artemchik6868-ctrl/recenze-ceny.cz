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
  const k = m[1].trim();
  if (!process.env[k]) process.env[k] = v;
}

const { supabaseAdmin } = await import(
  pathToFileURL(resolve(root, "src/integrations/supabase/client.server.ts")).href
);
const { data, error } = await supabaseAdmin
  .from("product_content")
  .select("source,offer_id,generated_at,display_title_uk")
  .eq("source", "shakes")
  .eq("offer_id", 12197)
  .maybeSingle();
console.log(JSON.stringify({ error, data, now: new Date().toISOString() }, null, 2));
