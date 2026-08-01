/**
 * LLM translate i18n.es + legal.es + category-descriptors.es → *.sl.ts
 * Run: node scripts/translate-ui-pl.mjs [--dry-run] [--force]
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "..");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const core = path.join(dir, "translate-ui-pl-core.ts");

const result = spawnSync(process.execPath, [tsxCli, core, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
