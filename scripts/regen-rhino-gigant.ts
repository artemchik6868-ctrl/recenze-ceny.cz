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

const { getOrGenerateProductContent } = await import("../src/lib/ai-content.server.ts");

for (const [src, id, slug] of [
  ["adcombo", 5902, "kosmeticke-nastroje"],
  ["shakes", 4191, "zvetseni-penisu"],
] as const) {
  const out = await getOrGenerateProductContent(src, id, "uk", slug, { forceRegen: true });
  console.log(`${src}:${id}`, out?.display_title ?? "FAIL");
}
