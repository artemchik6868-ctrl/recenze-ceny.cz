import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const built = readFileSync(
  resolve(root, "node_modules/.nitro/vite/services/ssr/assets/ai-content.server-CZsNuVIo.js"),
  "utf8",
);
const line = built.split("\n")[8834];
console.log("RAW:", line);
const r = line.match(/^\s*"([^"]+)":\s*\/\((.+)\)\/([gimsuy]*),?\s*$/);
console.log("MATCH:", !!r);
if (r) {
  const dec1 = (s) => Buffer.from(s, "latin1").toString("utf8");
  const dec2 = (s) => decodeURIComponent(escape(s));
  console.log("DEC latin1:", dec1(r[2]));
  console.log("DEC escape:", dec2(r[2]));
}
