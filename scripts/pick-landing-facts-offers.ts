/**
 * Pick N active Shakes offers with CZ adaptive landings, excluding prior smoke IDs.
 */
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
  process.env[m[1].trim()] = v;
}

const exclude = new Set([
  12197, 12619, 11937, 4201, 12889, // batch1 local llm
  8889, 13133, 13141, 13521, 13763, // batch2 local llm
  5911, 22128, 6247, // early worker heuristic
  13815, 13867, 14177, 14713, 14943, 15005, 15098, 15648, 15682, 16240, // worker llm batch3
]);
const limit = Number(process.argv[2] ?? 5);

const { createClient } = await import("@supabase/supabase-js");
const { pickAdaptiveLandingUrl } = await import(
  pathToFileURL(resolve(root, "src/lib/landing-facts.ts")).href
);

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data, error } = await sb
  .from("shakes_offers")
  .select("offer_id,title,raw,is_active")
  .eq("is_active", true)
  .limit(500);

if (error) {
  console.error(error);
  process.exit(1);
}

const picked: Array<{ id: number; title: string; url: string }> = [];
const seenTitles = new Set<string>();
for (const o of data ?? []) {
  const id = Number(o.offer_id);
  if (!id || exclude.has(id)) continue;
  const url = pickAdaptiveLandingUrl(o.raw ?? {});
  if (!url) continue;
  // CZ adaptive preference already applied in pickAdaptiveLandingUrl
  if (!/^https?:\/\/cz/i.test(url) && !/\.cz\b/i.test(url) && !/\/cz[-_/]/i.test(url)) {
    continue;
  }
  const titleKey = String(o.title ?? "")
    .toLowerCase()
    .replace(/\s*\d+\s*czk\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (seenTitles.has(titleKey)) continue;
  seenTitles.add(titleKey);
  picked.push({ id, title: o.title, url });
  if (picked.length >= limit) break;
}

console.log(JSON.stringify(picked, null, 2));
console.error(`ids=${picked.map((p) => p.id).join(",")}`);
