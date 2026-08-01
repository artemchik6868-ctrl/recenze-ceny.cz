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
  process.env[m[1].trim()] = v;
}

const { findOfferById } = await import(pathToFileURL(resolve(root, "src/lib/offers.server.ts")).href);

for (const id of [5911, 22128, 6247]) {
  const o = await findOfferById(id);
  console.log(
    JSON.stringify({
      id,
      title: o?.title ?? null,
      slug: o?.slug ?? null,
      url: o?.slug ? `https://recenze-ceny.cz/product/${o.slug}` : null,
    }),
  );
}
