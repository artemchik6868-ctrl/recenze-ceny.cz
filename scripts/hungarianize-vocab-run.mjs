import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const lib = path.join(ROOT, "src/lib");

function applyPhrases(text, phrases) {
  const sorted = [...phrases].sort((a, b) => b[0].length - a[0].length);
  let out = text;
  for (const [from, to] of sorted) out = out.split(from).join(to);
  return out;
}

const structuralHu = [
  [
    "Exemple de referință pentru conținut AI RO — single source of style/structure references.",
    "Magyar AI tartalom referenciapéldák — egységes stílus- és struktúraforrás.",
  ],
  ["Importat de ai-content.ro-prompts", "Importálva: ai-content.hu-prompts"],
  ["./category-descriptors.ro", "./category-descriptors.hu"],
  ["./problem-vocabulary.ro", "./problem-vocabulary.hu"],
  ["./shelf-topic.ro", "./shelf-topic.hu"],
  ["buildShelfTopicGuideRO", "buildShelfTopicGuideBG"],
  ["buildDescriptorStyleGuideRO", "buildDescriptorStyleGuideHU"],
  ["buildMultiSkuBrandFamilyBlockRO", "buildMultiSkuBrandFamilyBlockBG"],
  ["buildJointHondroFamilyBlockRO", "buildJointHondroFamilyBlockBG"],
  ["buildShelfGoldenBlockRO", "buildShelfGoldenBlockBG"],
  ["buildShelfGoldenFaqBlockRO", "buildShelfGoldenFaqBlockBG"],
];

const phraseFile = path.join(ROOT, "scripts", "hu-vocab-phrases.json");
const phrases = fs.existsSync(phraseFile)
  ? JSON.parse(fs.readFileSync(phraseFile, "utf8"))
  : [];

let ai = fs.readFileSync(path.join(lib, "ai-content.examples.ro.ts"), "utf8");
for (const [a, b] of structuralHu) ai = ai.split(a).join(b);
ai = applyPhrases(ai, phrases);
fs.writeFileSync(path.join(lib, "ai-content.examples.hu.ts"), ai);

const extra = [
  ["капсули срещу хемороиди", "hemorroida elleni kapszulák"],
  ["(когато feed-ът е за хемороиди)", "(ha a feed hemorroidákról szól)"],
  ["\\nЗа «", "\\n«"],
  ["étrend-kiegészítő pentru masculină vitalitate", "férfi vitalitás étrend-kiegészítő"],
  ["(nur wegen joint-care-Bucket)", "(csak joint-care bucket miatt)"],
  ["(nur wegen Marke — FALSCH)", "(csak márka miatt — HIBÁS)"],
  ["(nur wegen nervous-system-Bucket)", "(csak nervous-system bucket miatt)"],
  ["(nur wegen Partner-Bucket)", "(csak partner bucket miatt)"],
  ["(nur wegen Partner-Bucket — FALSCH)", "(csak partner bucket miatt — HIBÁS)"],
  ["(nur wegen Marke, balancioloss)", "(csak márka, balancioloss)"],
  ["(nur wegen Marke, othersh)", "(csak márka, othersh)"],
  ["spray pentru articulații", "ízületi spray"],
  ["sigilant găuri — sealant pentru găuri", "lyuktömítő — lyukakhoz"],
  ["(nur Marke, balancioloss landing)", "(csak márka, balancioloss landing)"],
  ["(nur Marke, neoflorax othersh landing)", "(csak márka, neoflorax othersh landing)"],
  ["(nur Marke, benagachaga othersh)", "(csak márka, benagachaga othersh)"],
  ["(nur Marke, rejuvsh landing)", "(csak márka, rejuvsh landing)"],
  ["(nur Marke, household bucket)", "(csak márka, household bucket)"],
  ["(nur Marke, rejuvsh, capsule)", "(csak márka, rejuvsh, kapszula)"],
  ["BUN:", "JÓ:"],
  ["RĂU:", "ROSSZ:"],
  ["Pentru acest produs", "Ehhez a termékhez"],
  ["Scrie ", "Írd "],
  ["Regulă:", "Szabály:"],
  ["Exemple:", "Példák:"],
  ["supliment alimentar", "étrend-kiegészítő"],
  ["capsule pentru potență", "potencia kapszulák"],
  ["picături pentru controlul greutății", "testsúlykontroll cseppek"],
  ["capsule pentru controlul greutății", "testsúlykontroll kapszulák"],
  ["gel pentru articulații", "ízületi gél"],
  ["capsule pentru articulații", "ízületi kapszulák"],
  ["capsule împotriva hemoroizilor", "hemorroida elleni kapszulák"],
  ["produs împotriva sforăitului", "horkolás elleni termék"],
  ["stare generală de bine", "általános közérzet"],
  ["căi respiratorii", "légzőszervi utak"],
  ["plămâni", "tüdő"],
];

for (const name of [
  "product-role.hu.ts",
  "product-intent.hu.ts",
  "shelf-disambiguation.hu.ts",
  "shelf-classification.examples.hu.ts",
  "ai-content.examples.hu.ts",
]) {
  let c = fs.readFileSync(path.join(lib, name), "utf8");
  c = applyPhrases(c, extra);
  c = applyPhrases(c, phrases);
  fs.writeFileSync(path.join(lib, name), c);
  const cyrRole = (c.match(/roleCs: \"[^\"]*[\u0400-\u04FF]/g) || []).length;
  console.log(`${name}: cyrillic in roleCs=${cyrRole}`);
}
