/** Verify image-facts inject payload for known PDPs (Phase 3). */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  const key = m[1].trim();
  if (!(key in process.env) || process.env[key] === "") process.env[key] = v;
}

const { getInjectableImageFacts } = await import(
  pathToFileURL(resolve(root, "src/lib/image-facts.server.ts")).href
);

const pairs = [
  ["shakes", 12197],
  ["kma", 7306],
  ["m1_top", 3639],
  ["shakes", 14345],
] as const;

for (const [source, id] of pairs) {
  const inj = await getInjectableImageFacts(source, id);
  console.log(
    JSON.stringify({
      key: `${source}:${id}`,
      hasHash: Boolean(inj.imageHash),
      hasPrompt: Boolean(inj.promptBlock),
      facts: inj.facts,
    }),
  );
}
