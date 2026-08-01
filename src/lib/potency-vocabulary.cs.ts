/** Potence a libido — kanonické konstanty; lexikon v shelf-topic.cs.ts. */

export const POTENCY_SLUG = "potence";
/** Legacy EN euphemism slug. */
export const POTENCY_SLUG_LEGACY = "mens-vitality";
/** Legacy DE-flavored slug (Potenz). */
export const POTENCY_SLUG_LEGACY_DE = "potenz-libido";
/** Pre-CZ-SEO compound shelf slug. */
export const POTENCY_SLUG_LEGACY_COMPOUND = "potence-libido";

export const POTENCY_CATEGORY_NAME = "Potence a libido";

/** Použití: buildDescriptorTail / krátký meta popis kategorie. */
export const POTENCY_DESCRIPTOR_SHORT = "pro mužskou potenci";

export const POTENCY_ROLE_DEFAULT = "doplněk stravy pro mužskou potenci";

/** Eufemismy — jen badExamples ve few-shotech, ne post-generační blokace. */
export const POTENCY_BAD_EUPHEMISMS = [
  "mužská vitalita",
  "vitalita pro muže",
  "životní energie",
  "mužská energie",
  "produkt pro mužský komfort",
  "energie a výdrž",
  "mužská síla",
] as const;

const LEGACY_SLUG_MAP: Record<string, string> = {
  [POTENCY_SLUG_LEGACY]: POTENCY_SLUG,
  [POTENCY_SLUG_LEGACY_DE]: POTENCY_SLUG,
  [POTENCY_SLUG_LEGACY_COMPOUND]: POTENCY_SLUG,
};

/** Mapování zastaralých DB / feed slugů na kanonický shelf slug. */
export function normalizePotencyShelfSlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  const s = slug.trim();
  return LEGACY_SLUG_MAP[s] ?? s;
}

/** Formou závislá role produktu: «kapsle na potenci», «kapky na potenci», … */
export function potencyRoleForForm(formLabel: string | null | undefined): string {
  const form = formLabel?.trim();
  if (!form) return POTENCY_ROLE_DEFAULT;
  const lc = form.toLowerCase();
  if (/pentru potență$/i.test(form)) return form;
  if (/capsule|tablete|picături|gel|produs|supliment/i.test(lc)) {
    const base = form.replace(/\s+pentru\s+.*$/i, "").trim() || form;
    return `${base} pro mužskou potenci`;
  }
  return `${form} ${POTENCY_DESCRIPTOR_SHORT}`.replace(/\s{2,}/g, " ").trim();
}
