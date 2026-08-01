/**
 * Alias for regen-shelf-missatches.ts (typo fix).
 * Usage: npx tsx scripts/regen-shelf-mismatches.ts [--dry-run]
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, "..");
const tsxCli = resolve(root, "node_modules", "tsx", "dist", "cli.mjs");
const core = resolve(dir, "regen-shelf-missatches.ts");

const result = spawnSync(process.execPath, [tsxCli, core, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
