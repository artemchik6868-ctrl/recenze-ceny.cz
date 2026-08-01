/**
 * Patch wrangler bundled undici.fetch → globalThis.fetch so win-fetch-proxy.mjs applies.
 * Idempotent; backs up original once as cli.js.bak
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = resolve(ROOT, "node_modules", "wrangler", "wrangler-dist", "cli.js");
const MARKER = "PATCHED_GLOBAL_FETCH";

if (!existsSync(cliPath)) {
  console.error("patch-wrangler-fetch: wrangler cli.js not found at", cliPath);
  process.exit(1);
}

const original = readFileSync(cliPath, "utf8");
if (original.includes(MARKER)) {
  console.log("patch-wrangler-fetch: already patched");
  process.exit(0);
}

const bakPath = `${cliPath}.bak`;
if (!existsSync(bakPath)) {
  writeFileSync(bakPath, original);
  console.log("patch-wrangler-fetch: backup →", bakPath);
}

const patched = original.replace(
  /\(0, import_undici\.fetch\)\(/g,
  "(globalThis.fetch)( /* PATCHED_GLOBAL_FETCH */ ",
);

if (patched === original) {
  console.error("patch-wrangler-fetch: pattern not found — wrangler version changed?");
  process.exit(1);
}

writeFileSync(cliPath, patched);
console.log("patch-wrangler-fetch: OK — undici.fetch → globalThis.fetch");
