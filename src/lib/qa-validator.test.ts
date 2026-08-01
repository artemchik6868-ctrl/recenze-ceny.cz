import assert from "node:assert/strict";
import type { AIProductContent } from "./ai-content.server";
import type { ProductBrief } from "./product-brief";
import { validateGenerated, QA_MIN_SAVE_HTML } from "./qa-validator";

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

function applianceBrief(): ProductBrief {
  return {
    source: "cpagetti",
    offerId: 1,
    categorySlug: "home",
    brand: "TestBrand",
    cleanTitle: "TestBrand",
    cleanedDescription: "LED projektor karácsonyi dísz.",
    physicalForm: {
      kind: "device",
      requiredTermsBg: [],
      requiredTermsRu: [],
    },
    niche: {},
    allowedLexicon: { uk: [], ru: [] },
    forbiddenLexicon: { uk: [], ru: [] },
    warnings: [],
    confidence: 1,
  };
}

function contentWithTitle(title: string, htmlLen = QA_MIN_SAVE_HTML + 100): AIProductContent {
  const html = `<p>${"x".repeat(htmlLen - 7)}</p>`;
  return {
    display_title: title,
    title: title,
    subtitle: "Rövid alcím a termékhez",
    meta_desc: "Meta leírás legalább huszonöt karakter.",
    intro: "",
    description_html: html,
    sections: [],
    reviews: [],
    faq: [
      { q: "Kérdés egy?", a: "Válasz egy." },
      { q: "Kérdés kettő?", a: "Válasz kettő." },
      { q: "Kérdés három?", a: "Válasz három." },
    ],
  };
}

ok("title QA errors are soft (variant A)", () => {
  const qa = validateGenerated(
    contentWithTitle("TestBrand — projektor"),
    applianceBrief(),
    "uk",
  );
  assert.equal(qa.hardErrors.length, 0);
  assert.ok(qa.softErrors.includes("garbled-display-title"));
  assert.equal(qa.severity, "warn");
});

ok("short HTML stays hard", () => {
  const qa = validateGenerated(
    contentWithTitle("TestBrand — LED projektor", 50),
    applianceBrief(),
    "uk",
  );
  assert.ok(qa.hardErrors.includes("description-html-too-short"));
  assert.equal(qa.severity, "critical");
});

if (failed > 0) process.exit(1);
