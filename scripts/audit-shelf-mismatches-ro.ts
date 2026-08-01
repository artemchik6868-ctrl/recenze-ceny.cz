/**
 * Audit catalog shelf vs title-first intent (RO showcase).
 * Alias with RO naming — core logic in audit-shelf-sl.ts.
 *
 * Usage:
 *   npx tsx scripts/audit-shelf-mismatches-cz.ts
 *   npx tsx scripts/audit-shelf-mismatches-cz.ts --json
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, "..");
const tsxCli = resolve(root, "node_modules", "tsx", "dist", "cli.mjs");
const core = resolve(dir, "audit-shelf-sl.ts");

const result = spawnSync(process.execPath, [tsxCli, core, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
