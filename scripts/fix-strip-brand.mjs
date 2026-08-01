import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsPath = resolve(root, "src/lib/ai-content.server.ts");
const snippet = readFileSync(resolve(root, "scripts/snippets/strip-brand-from-text.ts"), "utf8").trimEnd();
const lines = readFileSync(tsPath, "utf8").split("\n");

const start = lines.findIndex((l) => l.includes("export function stripBrandFromText"));
const end = lines.findIndex((l) => l.startsWith("function cleanGenerated"));
if (start < 0 || end < 0) throw new Error(`bounds start=${start} end=${end}`);

const out = [...lines.slice(0, start), snippet, ...lines.slice(end)];
writeFileSync(tsPath, out.join("\n"), "utf8");
console.log(`Replaced stripBrandFromText (${end - start} lines -> snippet)`);
