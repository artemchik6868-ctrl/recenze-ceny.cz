/**
 * LLM translate review templates ES → native Polish.
 * Run: node scripts/translate-reviews-pl.mjs [--only=slug] [--dry-run] [--force]
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "..");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const core = path.join(dir, "translate-reviews-pl-core.ts");

const result = spawnSync(process.execPath, [tsxCli, core, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
