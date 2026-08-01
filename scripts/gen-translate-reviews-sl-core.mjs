/**
 * Derive translate-reviews-sl-core.ts from translate-reviews-es-core.ts (ES→SL).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "scripts/translate-reviews-es-core.ts"), "utf8");

const ES_MARKERS =
  "const ES_MARKERS = /\\b(España|español|mensajería|¿|¡| en España|Pedido|envío|contento|contenta|seguro|segura|integratore|corriere)\\b/i;";

let t = src
  .replace(/LLM batch translate review \*\.it\.ts → native \*\.es\.ts/, "LLM batch translate review *.es.ts → native *.sl.ts")
  .replace(/review-templates-cat\.it/g, "review-templates-cat.es")
  .replace(/review-templates-theme\.it/g, "review-templates-theme.es")
  .replace(/review-templates-niche\.it/g, "review-templates-niche.es")
  .replace(/CATEGORY_IT_BODIES/g, "CATEGORY_ES_BODIES")
  .replace(/NICHE_TEMPLATES_IT/g, "NICHE_TEMPLATES_ES")
  .replace(/buildReviewVoiceGuideES/g, "buildReviewVoiceGuideSL")
  .replace(/review-voice\.es/g, "review-voice.sl")
  .replace(/category-descriptors\.es/g, "category-descriptors.sl")
  .replace(/review-themes\.es/g, "review-themes.sl")
  .replace(/translate-reviews-es/g, "translate-reviews-sl")
  .replace(/const IT_MARKERS =[\s\S]*?;/, ES_MARKERS)
  .replace(/italian marker/g, "spanish marker")
  .replace(/ItReviewBody/g, "EsReviewBody")
  .replace(/CATEGORY_ES_BODIES/g, "CATEGORY_ES_BODIES")
  .replace(/text_it/g, "text_es")
  .replace(/"es": string/g, '"sl": string')
  .replace(/row\.es/g, "row.sl")
  .replace(/validateReview/g, "validateReviewSl")
  .replace(/function validateReviewSl/g, "function validateReviewSl")
  .replace(/\.es\.ts/g, ".sl.ts")
  .replace(/review-templates-cat\.es/g, "review-templates-cat.sl")
  .replace(/review-templates-theme\.es/g, "review-templates-theme.sl")
  .replace(/review-templates-niche\.es/g, "review-templates-niche.sl")
  .replace(/review-templates-slug\.es/g, "review-templates-slug.sl")
  .replace(/CATEGORY_ES_TEXTS/g, "CATEGORY_SL_TEXTS")
  .replace(/CATEGORY_ES_BODIES/g, "CATEGORY_SL_BODIES")
  .replace(/NICHE_TEMPLATES_ES/g, "NICHE_TEMPLATES_SL")
  .replace(/REVIEW_SLOTS_BY_THEME/g, "REVIEW_SLOTS_BY_THEME")
  .replace(
    /Eres redactor de reseñas auténticas para un marketplace en España\./,
    "Si avtor pristnih mnenj za trgovino v Sloveniji (Recenze Ceny).",
  )
  .replace(/español de España/g, "slovenščina (sl-SI)")
  .replace(/España/g, "Slovenija")
  .replace(/getCategoryDescriptor/g, "getCategoryDescriptor");

t = t.replace(
  /function validateReviewSl\(g: "m" \| "f", text: string\): string\[\] \{[\s\S]*?return errs;\n\}/,
  `function validateReviewSl(g: "m" | "f", text: string): string[] {
  const errs: string[] = [];
  if (!text || text.length < 25) errs.push("too short");
  if (text.length > 280) errs.push("too long");
  if (CYRILLIC.test(text)) errs.push("cyrillic");
  if (ES_MARKERS.test(text)) errs.push("spanish marker");
  if (BROKEN_TOKENS.test(text)) errs.push("broken token");
  errs.push(...genderWarnings(g, text));
  return errs;
}`,
);

fs.writeFileSync(path.join(root, "scripts/translate-reviews-sl-core.ts"), t);
console.log("Wrote translate-reviews-sl-core.ts");
