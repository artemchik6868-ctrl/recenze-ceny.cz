import { readFileSync } from "fs";
const env = {};
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1].trim()] = v;
}
const { findOfferById } = await import("../../src/lib/offers.server.ts");
for (const id of [5911, 22128, 6247]) {
  const o = await findOfferById(id);
  console.log(JSON.stringify({
    id,
    title: o?.title ?? null,
    slug: o?.slug ?? null,
    url: o?.slug ? "https://recenze-ceny.cz/product/" + o.slug : null,
  }));
}