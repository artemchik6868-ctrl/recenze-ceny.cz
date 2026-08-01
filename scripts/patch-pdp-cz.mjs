/** One-shot mechanical HU→CZ for pdp-variants.ts (reference / re-run after bootstrap). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const RE = [
  [" Kc-tól", " od {price}"],
  [" Kc-ért", " za {price}"],
  [" Kc.", " {price}."],
  [" Kc,", " {price},"],
  [" Kc |", " {price} |"],
  [" — {price} Kc", " — {price}"],
  ["Česká republikaon", "v České republice"],
  ["egész Česká republikaon", "po celé České republice"],
  ["Futárral történő szállítás", "Doručení kurýrem"],
  ["Gyors futárral történő szállítás", "Rychlé doručení kurýrem"],
  ["utánvétes fizetés", "platba na dobírku"],
  ["Utánvétes fizetés", "Platba na dobírku"],
  ["Gyors szállítás", "Rychlé doručení"],
  ["előleg nélkül", "bez zálohy"],
  ["Rendeljen online", "Objednejte online"],
  ["Eredeti termék", "Originální produkt"],
  ["Szállítás és fizetés Česká republikaon", "Doprava a platba v České republice"],
  ["Szállítás egész Česká republikaon", "Doprava po celé České republice"],
  ["-tól.", "od ${priceLabel}."],
];

for (const rel of ["src/lib/pdp-variants.ts"]) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn("skip", rel);
    continue;
  }
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [a, b] of RE) next = next.split(a).join(b);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    console.log("patched", rel);
  } else {
    console.log("no changes", rel);
  }
}
