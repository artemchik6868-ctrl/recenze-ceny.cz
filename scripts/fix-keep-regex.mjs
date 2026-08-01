import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const built = readFileSync(
  resolve(root, "node_modules/.nitro/vite/services/ssr/assets/ai-content.server-CZsNuVIo.js"),
  "utf8",
);
const tsPath = resolve(root, "src/lib/ai-content.server.ts");
let ts = readFileSync(tsPath, "utf8");

const dec = (s) => Buffer.from(s, "latin1").toString("utf8");
const block = built.match(/const CATEGORY_KEEP_REGEX = \{([\s\S]*?)\};/)[1];

const lines = [];
for (const line of block.split("\n")) {
  const r = line.match(/^\s*"([^"]+)":\s*\/\((.+)\)\/([gimsuy]*),?\s*$/);
  if (!r) continue;
  const key = r[1] === "mens-vitality" ? "potence" : r[1];
  lines.push(`  "${key}": /(${dec(r[2])})/${r[3]},`);
}

const keepBlock = `const CATEGORY_KEEP_REGEX: Record<string, RegExp> = {\n${lines.join("\n")}\n};`;
ts = ts.replace(/const CATEGORY_KEEP_REGEX: Record<string, RegExp> = \{[\s\S]*?\};/, keepBlock);

// stopMarkers
const stopBlock = built.match(/const stopMarkers = \[([\s\S]*?)\];/);
if (stopBlock) {
  const markers = [];
  for (const m of stopBlock[1].matchAll(/\/\((.+)\)\/([gimsuy]*)/g)) {
    markers.push(`    /(${dec(m[1])})/${m[2]},`);
  }
  ts = ts.replace(/  const stopMarkers = \[[\s\S]*?\];/, `  const stopMarkers = [\n${markers.join("\n")}\n  ];`);
}

writeFileSync(tsPath, ts, "utf8");
console.log("Fixed CATEGORY_KEEP_REGEX + stopMarkers");
