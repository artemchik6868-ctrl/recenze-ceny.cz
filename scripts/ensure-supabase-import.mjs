import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const tsPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/lib/ai-content.server.ts");
let ts = readFileSync(tsPath, "utf8");
const imp = 'import { supabaseAdmin } from "@/integrations/supabase/client.server";\n';
if (!ts.includes('from "@/integrations/supabase/client.server"')) {
  ts = imp + ts;
  writeFileSync(tsPath, ts, "utf8");
  console.log("Added supabaseAdmin import");
} else {
  console.log("supabaseAdmin import already present");
}
