import assert from "node:assert/strict";
import {
  buildStep1Prompt,
  buildStep2Prompt,
  buildStep3Prompt,
  buildStep6Prompt,
  buildStep6bPrompt,
  buildPipelineFormHint,
  brandFormLockCs,
  buildFormHintBlock,
  parseJsonFromLlm,
  validateStep6bOpinion,
  STEP6B_OPINION_MIN_CHARS,
  PIPELINE_SYSTEM,
} from "./ai-content-pipeline.cs";
import { hasEnglishLeak } from "./brand-clean";
import { titleGarbledReason } from "./title-translate.server";

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

ok("PIPELINE_SYSTEM is Czech", () => {
  assert.match(PIPELINE_SYSTEM, /česk/i);
  assert.doesNotMatch(PIPELINE_SYSTEM, /magyar|Hungarian/i);
});

ok("buildStep1Prompt is Czech", () => {
  const prompt = buildStep1Prompt("Test Product", "описание", null);
  assert.match(prompt, /Vyčisti|česk|JSON/i);
  assert.doesNotMatch(prompt, /Tisztítsd|Csak JSON válasz/i);
});

ok("buildStep6bPrompt asks for first-person expert opinion in Czech", () => {
  const prompt = buildStep6bPrompt("Test Produkt", "feed context");
  assert.match(prompt, /první osob/i);
  assert.match(prompt, /mužský rod/i);
  assert.match(prompt, /praktický lékař/i);
  assert.match(prompt, /expert_opinion/i);
  assert.doesNotMatch(prompt, /első személy|hímnem/i);
});

ok("validateStep6bOpinion accepts plain text", () => {
  const text = "Po prostudování dat produktu ".repeat(8).trim();
  assert.ok(text.length >= STEP6B_OPINION_MIN_CHARS);
  validateStep6bOpinion(text);
});

ok("validateStep6bOpinion rejects HTML", () => {
  const text = `<p>${"Po prostudování dat produktu ".repeat(8)}</p>`;
  assert.throws(() => validateStep6bOpinion(text), /plain text/i);
});

ok("parseJsonFromLlm repairs multiline expert_opinion", () => {
  const raw = `{"expert_opinion":"První odstavec.

Druhý odstavec."}`;
  const parsed = parseJsonFromLlm<{ expert_opinion: string }>(raw);
  assert.match(parsed.expert_opinion, /První odstavec/);
  assert.match(parsed.expert_opinion, /Druhý odstavec/);
});

ok("buildStep2Prompt includes QA hint and display_title_cs", () => {
  const prompt = buildStep2Prompt("Brand – popis", null, { qaHint: "english_tail" });
  assert.match(prompt, /Předchozí QA chyba \(english_tail\)/);
  assert.match(prompt, /display_title_cs/);
  assert.doesNotMatch(prompt, /display_title_hu/);
});

ok("buildPipelineFormHint infers drops for ABSlim from brand", () => {
  const hint = buildPipelineFormHint({
    formKind: null,
    categorySlug: "hubnuti",
    rawTitle: "ABSlim",
    brand: "ABSlim",
  });
  assert.ok(hint);
  assert.equal(hint!.formKind, "drops");
  assert.equal(hint!.formLabelCs, "Kapky");
});

ok("buildFormHintBlock includes drops guidance in Czech", () => {
  const block = buildFormHintBlock({
    formKind: "drops",
    formLabelCs: "Kapky",
    expectedDescriptorCs: "kapky na kontrolu hmotnosti",
  });
  assert.match(block, /Kapky \(drops\)/);
  assert.match(block, /Orální kapky/i);
  assert.match(block, /Doporučený popis: kapky na kontrolu hmotnosti/);
});

ok("buildStep2Prompt includes Czech form hint for ABSlim drops", () => {
  const hint = buildPipelineFormHint({
    formKind: null,
    categorySlug: "hubnuti",
    rawTitle: "ABSlim",
    brand: "ABSlim",
  });
  const prompt = buildStep2Prompt("ABSlim - капли для похудения", hint);
  assert.match(prompt, /Ve feedu potvrzená forma: Kapky/);
  assert.match(prompt, /Doporučený popis:/);
});

ok("buildPipelineFormHint infers gel na zvětšení penisu for Gigant gel", () => {
  const hint = buildPipelineFormHint({
    formKind: "gel",
    categorySlug: "zvetseni-penisu",
    rawTitle: "Gigant",
    brand: "Gigant",
    feedSnippet: "gel for enlargement",
  });
  assert.ok(hint);
  assert.equal(hint!.formKind, "gel");
  assert.equal(hint!.formLabelCs, "Gel");
  assert.equal(hint!.expectedDescriptorCs, "gel na zvětšení penisu");
});

ok("buildPipelineFormHint infers capsules for Reishield valgus from product role", () => {
  const hint = buildPipelineFormHint({
    formKind: null,
    categorySlug: "vboceny-palec",
    rawTitle: "Reishield - kapsule za valgus",
    brand: "Reishield",
  });
  assert.ok(hint);
  assert.equal(hint!.formKind, "capsules");
  assert.equal(hint!.formLabelCs, "Kapsle");
  assert.match(hint!.expectedDescriptorCs ?? "", /vbočen/i);
});

ok("buildPipelineFormHint infers spray from product role", () => {
  const hint = buildPipelineFormHint({
    formKind: null,
    categorySlug: "vboceny-palec",
    rawTitle: "Hondro Sol - spray valgus",
    brand: "Hondro Sol",
  });
  assert.ok(hint);
  assert.equal(hint!.formKind, "spray");
  assert.equal(hint!.formLabelCs, "Sprej");
});

ok("brandFormLockCs locks gel for Removio", () => {
  const hint = brandFormLockCs("Removio -remedy for papillomas", "Removio");
  assert.ok(hint);
  assert.equal(hint!.formKind, "gel");
  assert.equal(hint!.formLabelCs, "Gel");
  assert.equal(hint!.expectedDescriptorCs, "gel proti bradavicím");
});

ok("brandFormLockCs locks gel for Hondroine", () => {
  const hint = brandFormLockCs("Hondroine - joint", "Hondroine");
  assert.ok(hint);
  assert.equal(hint!.formKind, "gel");
  assert.equal(hint!.formLabelCs, "Gel");
  assert.equal(hint!.expectedDescriptorCs, "kloubní gel");
});

ok("brandFormLockCs locks spray for Hondro Sol joint-care", () => {
  const hint = brandFormLockCs("Hondro Sol - arthritis", "Hondro Sol", "klouby");
  assert.ok(hint);
  assert.equal(hint!.formKind, "spray");
  assert.equal(hint!.formLabelCs, "Sprej");
  assert.equal(hint!.expectedDescriptorCs, "kloubní sprej");
});

ok("brandFormLockCs locks valgus spray descriptor for Hondro Sol", () => {
  const hint = brandFormLockCs("Hondro Sol - valgus", "Hondro Sol", "vboceny-palec");
  assert.ok(hint);
  assert.equal(hint!.formKind, "spray");
  assert.equal(hint!.expectedDescriptorCs, "sprej proti vbočeným palcům");
});

ok("brandFormLockCs locks gel for Icexin", () => {
  const hint = brandFormLockCs("Icexin - joint gel", "Icexin");
  assert.ok(hint);
  assert.equal(hint!.formKind, "gel");
  assert.equal(hint!.formLabelCs, "Gel");
  assert.equal(hint!.expectedDescriptorCs, "kloubní gel");
});

ok("brandFormLockCs locks gel for Hondrofrost", () => {
  const hint = brandFormLockCs("Hondrofrost SI", "Hondrofrost");
  assert.ok(hint);
  assert.equal(hint!.formKind, "gel");
  assert.equal(hint!.formLabelCs, "Gel");
  assert.equal(hint!.expectedDescriptorCs, "kloubní gel");
});

ok("brandFormLockCs locks drops for Redusizer", () => {
  const hint = brandFormLockCs("Redusizer weight loss", "Redusizer");
  assert.ok(hint);
  assert.equal(hint!.formKind, "drops");
  assert.equal(hint!.formLabelCs, "Kapky");
  assert.equal(hint!.expectedDescriptorCs, "kapky na hubnutí");
});

ok("brandFormLockCs locks capsules for ShiVital without descriptor", () => {
  const hint = brandFormLockCs("Shivital weight loss", "Shivital", "hubnuti");
  assert.ok(hint);
  assert.equal(hint!.formKind, "capsules");
  assert.equal(hint!.formLabelCs, "Kapsle");
  assert.equal(hint!.expectedDescriptorCs, undefined);
});

ok("buildFormHintBlock mentions oral capsules for ShiVital lock", () => {
  const hint = brandFormLockCs("Shi Vital S23404", "ShiVital");
  assert.ok(hint);
  const block = buildFormHintBlock(hint);
  assert.match(block, /Kapsle \(capsules\)/i);
  assert.match(block, /Orální kapsle/i);
  assert.doesNotMatch(block, /Doporučený popis/i);
});

ok("buildStep3Prompt is Czech", () => {
  const prompt = buildStep3Prompt("Test — kloubní gel", "feed");
  assert.match(prompt, /Vyber JEDNU kategorii/i);
  assert.doesNotMatch(prompt, /Válassz EGY kategóriát/i);
});

ok("buildStep6Prompt supplement has extra H2 blocks before disclaimer", () => {
  const prompt = buildStep6Prompt(
    "Diaform",
    "kapsle na cukrovku",
    { amount: 990, currency: "CZK" },
    "Doplňky stravy",
    "cukrovka",
  );
  assert.match(prompt, /kde ho lze koupit/i);
  assert.match(prompt, /lékárn/i);
  assert.match(prompt, /Cena Diaform/);
  assert.match(prompt, /Očekávané výsledky/i);
  assert.match(prompt, /podvod a je nebezpečný/i);
  assert.match(prompt, /Kontraindikace a opatření/i);
  assert.match(prompt, /11\. blok: Důležité upozornění/);
  const resultsIdx = prompt.indexOf("4. blok: Očekávané výsledky");
  const navodIdx = prompt.indexOf("5. blok: Návod k použití");
  const kontraIdx = prompt.indexOf("6. blok: Kontraindikace a opatření");
  const podvodIdx = prompt.indexOf("7. blok: Diaform — je to podvod");
  const priceIdx = prompt.indexOf("8. blok: Cena Diaform");
  const kdeIdx = prompt.indexOf("9. blok: Kde ho lze koupit");
  const deliveryIdx = prompt.indexOf("10. blok:");
  const disclaimerIdx = prompt.indexOf("11. blok: Důležité upozornění");
  assert.ok(resultsIdx > 0 && resultsIdx < navodIdx, "results before návod");
  assert.ok(kontraIdx > 0 && kontraIdx < podvodIdx, "kontraindikace before podvod");
  assert.ok(priceIdx < kdeIdx && kdeIdx < deliveryIdx && deliveryIdx < disclaimerIdx, "commerce order before disclaimer");
  assert.match(prompt, /oficiální distributor/i);
  assert.match(prompt, /NENÍ dostupný v lékárnách/);
  assert.doesNotMatch(prompt, /9\. blok: Diaform a kde/);
  assert.match(prompt, /čistý text/i);
  assert.match(prompt, /bez emoji/i);
  assert.doesNotMatch(prompt, /Emoji v h2\/h3/i);
});

ok("buildStep6Prompt non-YMYL adapts channels and safety H2", () => {
  const prompt = buildStep6Prompt(
    "USB ventilátor",
    "stolní ventilátor",
    { amount: 499, currency: "CZK" },
    "Domácnost",
    "domaci-potreby",
  );
  assert.match(prompt, /9\. blok: Kde ho lze koupit\n/);
  assert.doesNotMatch(prompt, /9\. blok:.*lékárn/i);
  assert.match(prompt, /8\. blok: Cena USB\n/);
  assert.match(prompt, /4\. blok: Co očekávat při používání/);
  assert.match(prompt, /5\. blok: Návod k použití/);
  assert.match(prompt, /jak poznat originál/i);
  assert.match(prompt, /Na co si dát pozor/i);
  assert.match(prompt, /11\. blok: Důležité upozornění/);
  const resultsIdx = prompt.indexOf("4. blok: Co očekávat");
  const navodIdx = prompt.indexOf("5. blok: Návod k použití");
  const safetyIdx = prompt.indexOf("6. blok: Na co si dát pozor");
  const originIdx = prompt.indexOf("7. blok:");
  assert.ok(resultsIdx > 0 && resultsIdx < navodIdx, "results before návod");
  assert.ok(safetyIdx > 0 && safetyIdx < originIdx, "safety before originál");
});

ok("buildStep6Prompt H2 uses brand only, full title stays in H1", () => {
  const full = "Diaform – kapsle na cukrovku";
  const prompt = buildStep6Prompt(
    full,
    "kapsle na cukrovku",
    { amount: 990, currency: "CZK" },
    "Doplňky stravy",
    "cukrovka",
  );
  assert.match(prompt, new RegExp(`Produkt \\(H1\\): ${full.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(prompt, /8\. blok: Cena Diaform\n/);
  assert.match(prompt, /9\. blok: Kde ho lze koupit v lékárnách/);
  assert.match(prompt, /7\. blok: Diaform — je to podvod/);
  assert.doesNotMatch(prompt, /8\. blok: Cena Diaform – kapsle/);
  assert.doesNotMatch(prompt, /9\. blok: Diaform/);
  assert.doesNotMatch(prompt, /7\. blok: Diaform – kapsle/);
});

ok("titleGarbledReason accepts Czech display title", () => {
  assert.equal(titleGarbledReason("Hondrofrost — kloubní gel"), null);
});

ok("hasEnglishLeak flags Hungarian tails with English tokens", () => {
  assert.equal(hasEnglishLeak("LED night vision device"), true);
  assert.equal(hasEnglishLeak("USB ventilátor"), false);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll CZ pipeline prompt tests passed");
