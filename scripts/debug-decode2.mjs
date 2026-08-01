import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const built = readFileSync(
  resolve(root, "node_modules/.nitro/vite/services/ssr/assets/ai-content.server-CZsNuVIo.js"),
  "utf8",
);
const line = built.split("\n")[8834];
const r = line.match(/^\s*"([^"]+)":\s*\/\((.+)\)\/([gimsuy]*),?\s*$/);
const s = r[2];
console.log("chars:", [...s.slice(0, 8)].map((c) => c.charCodeAt(0).toString(16)).join(" "));

// cp1251 bytes -> utf8
const cp1251 = await import("iconv-lite").catch(() => null);
if (cp1251) {
  const fixed = cp1251.default.decode(cp1251.default.encode(s, "win1251"), "utf8");
  console.log("iconv win1251:", fixed);
}

// manual: treat each char as cp1251 code point -> byte
const bytes = new Uint8Array(s.length);
for (let i = 0; i < s.length; i++) {
  const code = s.charCodeAt(i);
  if (code > 255) {
    // cp1251 reverse map for common Cyrillic mojibake range
    bytes[i] = code > 0x400 ? code - 0x350 : code; // hack
  } else bytes[i] = code;
}
console.log("manual:", new TextDecoder("utf-8").decode(bytes.slice(0, 20)));
