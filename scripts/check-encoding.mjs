import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const tsPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/lib/ai-content.server.ts");
const line = readFileSync(tsPath, "utf8").split("\n")[206];
console.log(line.slice(0, 80));
console.log([...line.slice(15, 25)].map((c) => c.charCodeAt(0).toString(16)).join(" "));
