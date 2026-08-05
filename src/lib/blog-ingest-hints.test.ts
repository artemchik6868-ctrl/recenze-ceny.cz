import assert from "node:assert/strict";
import { hintShelfFromText, hintShelvesFromText } from "./blog-ingest.server";

let failed = 0;

function ok(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

ok("cukrovka + demence → [cukrovka, stres] (primary cukrovka)", () => {
  const title = "Jak cukrovka ovlivňuje mozek a riziko demence";
  assert.deepEqual(hintShelvesFromText(title), ["cukrovka", "stres"]);
  assert.equal(hintShelfFromText(title), "cukrovka");
});

ok("diabetes / blood sugar → cukrovka only", () => {
  assert.deepEqual(hintShelvesFromText("Type 2 diabetes and blood sugar control"), [
    "cukrovka",
  ]);
  assert.deepEqual(hintShelvesFromText("Prediabetes: jak snížit glukózu"), ["cukrovka"]);
});

ok("pure Alzheimer / dementia / paměť → stres only", () => {
  assert.deepEqual(hintShelvesFromText("Alzheimerova choroba a paměť"), ["stres"]);
  assert.deepEqual(
    hintShelvesFromText("Early signs of dementia and cognitive impairment"),
    ["stres"],
  );
});

ok("anxiety / sleep without disease → stres", () => {
  assert.deepEqual(hintShelvesFromText("Jak zvládat stres a úzkost"), ["stres"]);
  assert.deepEqual(hintShelvesFromText("Poor sleep and circadian rhythm tips"), ["stres"]);
});

ok("hypertension + paměť → [krevni-tlak, stres]", () => {
  assert.deepEqual(
    hintShelvesFromText("High blood pressure and risk of memory loss (paměť)"),
    ["krevni-tlak", "stres"],
  );
  assert.equal(
    hintShelfFromText("High blood pressure and risk of memory loss (paměť)"),
    "krevni-tlak",
  );
});

ok("max two shelves even if more niches match", () => {
  const shelves = hintShelvesFromText(
    "Diabetes hypertension joint pain and Alzheimer dementia memory",
  );
  assert.equal(shelves.length, 2);
  assert.equal(shelves[0], "cukrovka");
  assert.equal(shelves[1], "krevni-tlak");
});

if (failed > 0) process.exit(1);
console.log("\nAll blog-ingest hint tests passed.");
