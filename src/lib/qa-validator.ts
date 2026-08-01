// QA validator for AI-generated product content (v57 ai-only pipeline).
//
// Hard errors → block save + partial retry in pipeline.
// Soft errors → qa_status=warn; caller still saves AI output (title QA is soft).

import type { AIProductContent } from "./ai-content.server";
import type { ProductBrief } from "./product-brief";
import { getNicheType } from "./niche-types";
import { requiredTermsBg } from "./product-facts.cs-labels";
import {
  isHeadlineDuplicateBrand,
  extractFirstH2Text,
  splitBrandAndTail,
  containsAffiliateSkuTokens,
} from "./brand-clean";
import {
  hasGermanLocaleLeak,
  hasPolishLocaleLeak,
  hasSlovenianLocaleLeak,
  hasPolishDeliveryLeak,
  hasCyrillicLocaleLeak,
} from "./locale-leak-cz";
import { isGenericBgDescriptor, titleGarbledReason } from "./title-translate.server";

export type QAResult = {
  ok: boolean;
  severity: "ok" | "warn" | "critical";
  errors: string[];
  hardErrors: string[];
  softErrors: string[];
};

const HTML_ENTITY_RE = /&(?:#x[0-9a-fA-F]+|#\d+|amp|apos|quot|lt|gt|nbsp);/;

const STALE_TEMPLATE_SIGS: RegExp[] = [
  /componenti attivi in sinergia per la categoria/iu,
  /formula con estratti vegetali per supporto quotidiano/iu,
  /aktivne sestavine v sinergiji za kategorijo/iu,
  /formula z rastlinskimi ekstrakti za vsakodnevno podporo/iu,
  /integratore\s+naturale\s+per\s+supporto\s+complessivo/iu,
  /disponible para pedido/iu,
  /informaci(?:o|\u00f3)n sobre/i,
];

const COMPOSITION_VAGUE_RE =
  /ni naveden|ni potrjeno|preveriti pri|vpra[sš]ajte upravitelja|non\s+indicat|da\s+verificare|non\s+confermat|chiedere\s+al\s+manager/i;

/** Minimum HTML length to retry (hard). */
export const QA_MIN_SAVE_HTML = 400;
/** Target HTML length for supplements (soft if below). */
export const QA_MIN_AI_HTML_SUPPLEMENT = 800;
/** Target HTML length for appliances (soft if below). */
export const QA_MIN_AI_HTML_APPLIANCE = 400;

function blob(c: AIProductContent): string {
  return [
    c.display_title,
    c.title,
    c.subtitle,
    c.meta_desc,
    c.intro,
    c.description_html ?? "",
    ...(c.sections ?? []).flatMap((s) => [s.heading, s.body]),
    ...(c.faq ?? []).flatMap((f) => [f.q, f.a]),
  ]
    .filter(Boolean)
    .join(" \n ");
}

export type QAValidateOpts = {
  attempt?: number;
  maxAttempts?: number;
};

function isHardError(code: string): boolean {
  return (
    code.startsWith("html-entities") ||
    code === "cyrillic-in-content" ||
    code === "unsubstituted-brand-placeholder" ||
    code.startsWith("stale-template") ||
    code === "description-html-too-short" ||
    code === "supplement-template-on-appliance"
  );
}

const ORAL_PRODUCT_KINDS = new Set([
  "capsules", "tablets", "drops", "tea", "syrup", "powder", "sachet", "ampoules",
]);

export function validateGenerated(
  content: AIProductContent,
  brief: ProductBrief,
  lang: "uk" | "ru",
  _opts: QAValidateOpts = {},
): QAResult {
  const hardErrors: string[] = [];
  const softErrors: string[] = [];
  const text = blob(content);
  const textLc = text.toLowerCase();
  const required =
    lang === "uk" ? requiredTermsBg(brief.physicalForm) : brief.physicalForm.requiredTermsRu;

  const nicheType = getNicheType(brief.categorySlug);
  const isAppliance = ["home", "garden", "auto", "fashion", "device"].includes(nicheType);
  const htmlLen = content.description_html?.length ?? 0;

  if (htmlLen > 0 && htmlLen < QA_MIN_SAVE_HTML) {
    hardErrors.push("description-html-too-short");
  }

  if (HTML_ENTITY_RE.test(text)) hardErrors.push("html-entities-present");
  if (/\$\{b\}/.test(text)) hardErrors.push("unsubstituted-brand-placeholder");
  if (hasCyrillicLocaleLeak(text)) hardErrors.push("cyrillic-in-content");
  if (hasPolishLocaleLeak(text)) softErrors.push("polish-locale-leak");
  if (hasPolishDeliveryLeak(text)) softErrors.push("polish-delivery-leak");
  if (lang === "uk" && hasGermanLocaleLeak(text)) softErrors.push("german-locale-leak");
  if (lang === "uk" && hasSlovenianLocaleLeak(text)) softErrors.push("slovenian-locale-leak");
  if (lang === "uk" && /livrare|plat[aă] la livrare|românia|în românia/i.test(textLc)) {
    softErrors.push("romanian-locale-leak");
  }

  if (
    required.length > 0 &&
    brief.physicalForm.kind !== "unknown" &&
    brief.physicalForm.kind !== "generic_item"
  ) {
    const ok = required.some((t) => textLc.includes(t.toLowerCase()));
    if (!ok) softErrors.push(`form-word-missing:${required[0]}`);
  }

  const sourceLc = (brief.cleanedDescription || "").toLowerCase();
  for (const re of STALE_TEMPLATE_SIGS) {
    if (!re.test(text)) continue;
    if (re.test(sourceLc)) continue;
    hardErrors.push(`stale-template:${re.source.slice(0, 40)}`);
    break;
  }

  const mm = lang === "uk" ? brief.niche.uk?.mustMention : brief.niche.ru?.mustMention;
  if (mm && mm.length > 0) {
    const hit = mm.some((t) => textLc.includes(t.toLowerCase()));
    if (!hit) softErrors.push("niche-must-mention-missing");
  }

  if (isAppliance && !ORAL_PRODUCT_KINDS.has(brief.physicalForm.kind)) {
    if (
      /come\s+assumer|schema\s+(del\s+)?ciclo|composizion|integratore\s+alimentare|compresse|c[oó]mo\s+tomar|cikel\s+jemanja|kako\s+jemati|sestava\s+in\s+način/i.test(
        textLc,
      )
    ) {
      hardErrors.push("supplement-template-on-appliance");
    }
  }

  const displayTitle = (content.display_title ?? "").trim();
  if (lang === "uk" && displayTitle && hasGermanLocaleLeak(displayTitle)) {
    softErrors.push("german-descriptor-in-title");
  }
  if (lang === "uk" && displayTitle) {
    if (containsAffiliateSkuTokens(displayTitle) || /\blow\s+low\b/i.test(displayTitle)) {
      softErrors.push("affiliate-noise-in-title");
    }
    const { tail } = splitBrandAndTail(displayTitle);
    if (isGenericBgDescriptor(tail)) {
      softErrors.push("generic-descriptor-in-title");
    }
    if (titleGarbledReason(displayTitle)) {
      softErrors.push("garbled-display-title");
    }
  }
  if (displayTitle && isHeadlineDuplicateBrand(displayTitle)) {
    softErrors.push("headline-duplicate-brand");
  }
  const firstH2 = extractFirstH2Text(content.description_html ?? "");
  if (displayTitle && firstH2 && displayTitle.toLowerCase() === firstH2.toLowerCase()) {
    softErrors.push("h1-equals-first-h2");
  }
  if (nicheType === "supplement" && displayTitle) {
    const { brand, tail } = splitBrandAndTail(displayTitle);
    if (brand && !tail.trim()) softErrors.push("headline-missing-descriptor");
  }

  if (nicheType === "supplement") {
    const html = content.description_html ?? "";
    const lower = html.toLowerCase();
    if (
      brief.categorySlug === "plisen-nehtu" &&
      ORAL_PRODUCT_KINDS.has(brief.physicalForm.kind) &&
      /aplicare extern|aplicare pe unghie|gelauftrag|cremă antifung|spray antifung|solu[țt]ie antifung/i.test(
        textLc,
      )
    ) {
      hardErrors.push("oral-fungus-topical-leak");
    }
    const hasComposition = /složení|složka|složek|účinná látka|komponent|ingredien/i.test(lower);
    const hasIntake = /příjem|aplikace|dávka|schéma|užívání|použití|návod k použití|dávkování/i.test(lower);
    const hasDelivery = /doručení|dobírka|kurýr|česká republika|objednat|platba/i.test(lower);
    if (!(hasComposition && hasIntake && hasDelivery)) {
      softErrors.push("supplement-structure-missing");
    }
    if (hasDelivery && !/Praha|Brno|Ostrava|Plzeň|Liberec|Olomouc|České republice/i.test(html)) {
      softErrors.push("delivery-cities-missing");
    }
    const compBlock = html
      .split(/<h2[^>]*>/i)
      .slice(1)
      .find((b) => /състав|ингредиен|компонент/i.test(b.split(/<\/h2>/i)[0] ?? ""));
    if (compBlock && COMPOSITION_VAGUE_RE.test(compBlock.replace(/<[^>]+>/g, " "))) {
      softErrors.push("composition-too-vague");
    }
  }

  if (!content.subtitle || content.subtitle.length < 10) softErrors.push("subtitle-missing");
  if (!content.meta_desc || content.meta_desc.length < 24) softErrors.push("meta-desc-missing");

  const errors = [...hardErrors, ...softErrors];
  if (hardErrors.length > 0) {
    return { ok: false, severity: "critical", errors, hardErrors, softErrors };
  }
  if (softErrors.length > 0) {
    return { ok: false, severity: "warn", errors, hardErrors, softErrors };
  }
  return { ok: true, severity: "ok", errors: [], hardErrors: [], softErrors: [] };
}
