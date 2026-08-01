#!/usr/bin/env tsx
/**
 * Dev-only audit: review gender voice + per-slug topic relevance (ES storefront).
 *
 * Usage: npx tsx scripts/audit-review-voice.ts
 */
import { CATEGORY_TEMPLATES } from "../src/data/review-templates";
import { REVIEW_SLOTS_BY_SLUG } from "../src/data/review-templates-slug.es";
import { NICHE_TEMPLATES_ES } from "../src/data/review-templates-niche.es";
import { CATEGORY_ES_BODIES } from "../src/data/review-templates-cat.es";
import { REVIEW_REUSE_CATEGORY } from "../src/lib/review-themes.es";

const FEMININE_MARKERS = [
  /\bsegura\b/i,
  /\bcontenta\b/i,
  /\bsatisfecha\b/i,
  /\btomada\b/i,
  /\bsentada\b/i,
  /\bretirada\b/i,
  /\bvuelta\b/i,
  /\bquedada\b/i,
];

const MASCULINE_MARKERS = [
  /\bseguro\b/i,
  /\bcontento\b/i,
  /\bsatisfecho\b/i,
  /\btomado\b/i,
  /\bsentado\b/i,
  /\bretirado\b/i,
  /\bvuelto\b/i,
  /\bquedado\b/i,
];

/** Forbidden keywords per slug pool (cross-topic bleed). */
const SLUG_FORBIDDEN: Record<string, RegExp[]> = {
  cystitida: [/hemorro|hemorroid/i, /psoriasis|psori/i],
  "intimate-comfort": [/cistitis\b/i, /micción nocturna/i, /urgencia en el baño/i],
  "anti-aging": [/psoriasis|psori\b|placas rojas/i],
  lupenka: [/anti-?age|arrugas en la frente|luminosa\b/i],
  "zvetseni-prsou": [/caída del cabello|entradas|peine/i],
  "vypadavani-vlasu": [/para el pecho|pecho caído|escote/i],
  "zdravi-zen": [/para el pecho|pecho caído|aumento de pecho/i],
  sluch: [/articulac/i, /digestión/i, /rodillas/i],
  "stres": [/articulac/i, /rodillas/i],
};

const SUPPLEMENT_SLUGS = Object.keys(REVIEW_SLOTS_BY_SLUG);

function genderWarnings(gender: "m" | "f", text: string, ctx: string) {
  const w: string[] = [];
  const markers = gender === "m" ? FEMININE_MARKERS : MASCULINE_MARKERS;
  const label = gender === "m" ? "feminine" : "masculine";
  for (const re of markers) {
    if (re.test(text)) w.push(`${ctx}: ${label} marker ${re} on ${gender} slot`);
  }
  return w;
}

function slugTopicWarnings(slug: string, text: string, ctx: string) {
  const w: string[] = [];
  for (const re of SLUG_FORBIDDEN[slug] ?? []) {
    if (re.test(text)) w.push(`${ctx}: off-topic ${re} for slug ${slug}`);
  }
  return w;
}

function auditCategoryBodies(slug: string) {
  const w: string[] = [];
  const bodies = CATEGORY_ES_BODIES[slug];
  const slots = CATEGORY_TEMPLATES[slug];
  if (!bodies || !slots) return w;
  for (let i = 0; i < Math.min(bodies.length, slots.length); i++) {
    const ctx = `${slug}[${i}]`;
    w.push(...genderWarnings(slots[i].gender, bodies[i].text, ctx));
    if (bodies[i].g !== slots[i].gender) {
      w.push(`${ctx}: body.g=${bodies[i].g} != slot.gender=${slots[i].gender}`);
    }
  }
  return w;
}

const warnings: string[] = [];

for (const slug of Object.keys(CATEGORY_ES_BODIES)) {
  warnings.push(...auditCategoryBodies(slug));
}

for (const slug of SUPPLEMENT_SLUGS) {
  const slots = REVIEW_SLOTS_BY_SLUG[slug] ?? [];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const ctx = `slug:${slug}[${i}]`;
    warnings.push(...genderWarnings(s.gender, s.text_es ?? "", ctx));
    warnings.push(...slugTopicWarnings(slug, s.text_es ?? "", ctx));
  }
  if (!REVIEW_REUSE_CATEGORY[slug] && !CATEGORY_TEMPLATES[slug] && slots.length < 8) {
    warnings.push(`slug:${slug}: expected 8 slots, got ${slots.length}`);
  }
}

const badNiche = [/articulac/i, /digestión/i, /rodillas/i, /próstata/i];
for (let i = 0; i < NICHE_TEMPLATES_ES.supplement.length; i++) {
  const t = NICHE_TEMPLATES_ES.supplement[i].text_es ?? "";
  for (const re of badNiche) {
    if (re.test(t)) warnings.push(`niche:supplement[${i}]: symptom keyword ${re}`);
  }
}

if (warnings.length) {
  console.error(`audit-review-voice: ${warnings.length} warning(s):\n`);
  for (const w of warnings) console.error(`  - ${w}`);
  process.exit(1);
}

console.log("audit-review-voice: OK (0 warnings)");
