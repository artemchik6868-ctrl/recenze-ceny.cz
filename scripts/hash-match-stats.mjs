import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(m[1].trim() in process.env) || process.env[m[1].trim()] === "") process.env[m[1].trim()] = v;
}

const { getExpectedSourceHash, PIPELINE_VERSION } = await import("../src/lib/ai-content.server.ts");
const { createClient } = await import("@supabase/supabase-js");

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: rows } = await sb
  .from("product_content")
  .select("source,offer_id,source_hash,generated_at")
  .not("description_html_uk", "is", null);

let hashMatch = 0;
let hashMismatch = 0;
const mismatchSamples = [];

for (const row of rows ?? []) {
  const expected = await getExpectedSourceHash(row.source, row.offer_id);
  if (expected === row.source_hash) hashMatch++;
  else {
    hashMismatch++;
    if (mismatchSamples.length < 5) {
      mismatchSamples.push({
        id: `${row.source}:${row.offer_id}`,
        stored: row.source_hash,
        expected,
        generated_at: row.generated_at,
      });
    }
  }
}

const { data: briefs } = await sb.from("product_briefs").select("pipeline_version");
const briefPv = {};
for (const b of briefs ?? []) {
  const v = b.pipeline_version ?? "null";
  briefPv[v] = (briefPv[v] ?? 0) + 1;
}

console.log(
  JSON.stringify(
    {
      pipeline_version: PIPELINE_VERSION,
      hash_match: hashMatch,
      hash_mismatch: hashMismatch,
      mismatch_samples: mismatchSamples,
      brief_pipeline_versions: briefPv,
    },
    null,
    2,
  ),
);
