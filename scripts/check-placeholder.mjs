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

const { isPlaceholderHtml, PLACEHOLDER_HTML_MARKERS } = await import("../src/lib/ai-content.server.ts");

for (const file of [
  "trace-cpa_tl-21180-run1-attempt1.html",
  "trace-cpa_tl-21180-run2-attempt1.html",
  "trace-cpa_tl-21180-run3-attempt1.html",
]) {
  const html = readFileSync(resolve(root, "scripts/out", file), "utf8");
  console.log(`\n${file} len=${html.length} isPlaceholder=${isPlaceholderHtml(html)}`);
  for (const m of PLACEHOLDER_HTML_MARKERS) {
    if (html.toLowerCase().includes(m.toLowerCase())) console.log(`  marker hit: "${m}"`);
  }
}
