/**
 * Guard: CZ repo must NEVER deploy to SI/ES/IT/UA production workers.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ALLOWED = "recenze-ceny";
const FORBIDDEN = [
  "tanstack-start-app",
  "espertirecensioni",
  "opinionestop",
  "najboljsamnenja",
  "expertrecenzje",
  "meinungcheck",
  "product-reviews",
  "recenziiproduse",
];

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const wranglerPath = join(root, "wrangler.jsonc");
const raw = readFileSync(wranglerPath, "utf8");
const match = raw.match(/"name"\s*:\s*"([^"]+)"/);
const name = match?.[1];

if (!name) {
  console.error("verify-deploy-target: could not read worker name from wrangler.jsonc");
  process.exit(1);
}

if (FORBIDDEN.includes(name)) {
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  DEPLOY BLOCKED — wrong Cloudflare Worker                        ║
╠══════════════════════════════════════════════════════════════════╣
║  This CZ repo must deploy to "${ALLOWED}", not "${name}".          ║
╚══════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

if (name !== ALLOWED) {
  console.error(`verify-deploy-target: unexpected worker name "${name}" (expected "${ALLOWED}")`);
  process.exit(1);
}

console.log(`verify-deploy-target: OK — will deploy to worker "${name}"`);
