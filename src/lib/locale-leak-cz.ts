/** Detect German, Polish, Slovenian, Romanian, and other non-BG locale leaks for the BG storefront. */

import { CYRILLIC_TEXT_RE } from "./cyrillic-tail-de";

export { CYRILLIC_TEXT_RE };

export const ROMANIAN_DIACRITICS_RE = /[ăâîșțĂÂÎȘȚ]/;

export const GERMAN_PHRASE_PATTERNS: readonly RegExp[] = [
  /\bZahlung bei Lieferung\b/i,
  /\bStartseite\b/i,
  /\bSchweiz\b/i,
  /\bDeutschland\b/i,
  /\bÖsterreich\b/i,
  /\bBitte geben Sie\b/i,
  /\bAllgemeine Geschäftsbedingungen\b/i,
  /\bWir rufen Sie\b/i,
  /\bKostenloser\b/i,
  /\bRückgaberecht\b/i,
  /\bHersteller\b/i,
  /\bGesundheitsprodukte\b/i,
  /\bWie bezahle ich\b/i,
  /\bHäufig gestellte Fragen\b/i,
  /\bNatürliche\b/i,
  /\bVerpackung\b/i,
  /\bWerktage\b/i,
  /\bSie zahlen\b/i,
  /\bKatalog mit\b/i,
  /\bProduct Reviews\b/i,
];

export const ROMANIAN_PHRASE_PATTERNS: readonly RegExp[] = [
  /\bPlata la livrare\b/i,
  /\bRecenzii Produse\b/i,
  /\bîn România\b/i,
  /\bRomânia\b/i,
  /\bCategorii\b/i,
  /\bLivrare\b/i,
  /\bComandă acum\b/i,
  /\bComandați\b/i,
  /\bComandati\b/i,
  /\blivrare până\b/i,
  /\bLivrare până\b/i,
  /\bPlată la livrare\b/i,
  /\bCeva nu a mers bine\b/i,
  /\bproduse de sănătate\b/i,
  /\bpentru\b/i,
  /\bîmpotriva\b/i,
  /\bimpotriva\b/i,
  /\bsupliment\s+alimentar\b/i,
  /\bsuport\s+renal\b/i,
  /\bcontrolul\s+greut[aăț]/i,
  /\barticula[tț]ii\b/i,
  /\bînc[aă]lzitor\b/i,
  /\bcur[aă][tț][aă]tor\b/i,
];

export const POLISH_PHRASE_PATTERNS: readonly RegExp[] = [
  /\bdostawa\b/i,
  /\bpłatność\b/i,
  /\bw polsce\b/i,
  /\bsuplement diety\b/i,
  /\bkapsułki\b/i,
  /\bpo polsku\b/i,
];

export const SLOVENIAN_PHRASE_PATTERNS: readonly RegExp[] = [
  /\bslovens/i,
  /\bSlovenija\b/i,
  /\bLjubljana\b/i,
  /\bna voljo\b/i,
  /\bizdelek\b/i,
  /\bdopolnilo\b/i,
];

export const CS_PLACEHOLDER_MARKERS: readonly string[] = [
  "scop si forma de produs",
  "compozitie si mod de actiune",
  "zweck und produktform",
  "zusammensetzung und wirkungsweise",
  "haufig gestellte fragen",
];

/** Hungarian uses ö/ü (same codepoints as German) — detect HU before umlaut heuristics. */
const HUNGARIAN_LATIN_MARKERS =
  /[őű]|\b(egész|hogy|vagy|nincs|kérjük|termék|szállítás|fizetés|českýország|utánvét|futár|rendelés|kategória|ellenőrzött)\b/i;

export function hasGermanLocaleLeak(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  if (HUNGARIAN_LATIN_MARKERS.test(text)) return false;
  if (/[äß]/i.test(text)) return true;
  if (/[öü]/i.test(text)) {
    for (const re of GERMAN_PHRASE_PATTERNS) {
      if (re.test(text)) return true;
    }
    return false;
  }
  for (const re of GERMAN_PHRASE_PATTERNS) {
    if (re.test(text)) return true;
  }
  return false;
}

export function hasRomanianLocaleLeak(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  if (ROMANIAN_DIACRITICS_RE.test(text)) return true;
  for (const re of ROMANIAN_PHRASE_PATTERNS) {
    if (re.test(text)) return true;
  }
  return false;
}

export function hasPolishLocaleLeak(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  for (const re of POLISH_PHRASE_PATTERNS) {
    if (re.test(text)) return true;
  }
  return false;
}

export function hasSlovenianLocaleLeak(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  for (const re of SLOVENIAN_PHRASE_PATTERNS) {
    if (re.test(text)) return true;
  }
  return false;
}

export const HUNGARIAN_PHRASE_PATTERNS: readonly RegExp[] = [
  /\bUtánvétes fizetés\b/i,
  /\bMagyarország\b/i,
  /\bKategóriák\b/i,
  /\bKezdőlap\b/i,
  /\bVelemenyLab\b/i,
  /\bSzállítás egész\b/i,
];

export function hasHungarianLocaleLeak(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  for (const re of HUNGARIAN_PHRASE_PATTERNS) {
    if (re.test(text)) return true;
  }
  return HUNGARIAN_LATIN_MARKERS.test(text);
}

/** Cyrillic in CZ storefront is a leak (native script is Latin). */
export function hasCyrillicLocaleLeak(text: string | null | undefined): boolean {
  if (!text) return false;
  return CYRILLIC_TEXT_RE.test(text);
}

export function hasNonCzechLocaleLeak(text: string | null | undefined): boolean {
  return (
    hasGermanLocaleLeak(text) ||
    hasRomanianLocaleLeak(text) ||
    hasPolishLocaleLeak(text) ||
    hasSlovenianLocaleLeak(text) ||
    hasHungarianLocaleLeak(text) ||
    hasCyrillicLocaleLeak(text)
  );
}

export const hasNonRomanianLocaleLeak = hasNonCzechLocaleLeak;
export const hasNonGermanLocaleLeak = hasNonCzechLocaleLeak;

export type ProductContentBlob = {
  display_title?: string | null;
  description_html?: string | null;
  sections?: Array<{ heading?: string; body?: string }> | null;
  faq?: Array<{ q?: string; a?: string }> | null;
};

export function productContentBlob(content: ProductContentBlob): string {
  const parts = [
    content.display_title ?? "",
    content.description_html ?? "",
    ...(content.sections ?? []).flatMap((s) => [s.heading ?? "", s.body ?? ""]),
    ...(content.faq ?? []).flatMap((f) => [f.q ?? "", f.a ?? ""]),
  ];
  return parts.filter(Boolean).join("\n");
}

export function hasNonCzechProductContent(content: ProductContentBlob | null | undefined): boolean {
  if (!content) return false;
  return hasNonCzechLocaleLeak(productContentBlob(content));
}

export const hasNonRomanianProductContent = hasNonCzechProductContent;
export const hasNonGermanProductContent = hasNonCzechProductContent;

export function hasWrongMarketLeak(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  return /\b(Schweiz|Deutschland|Österreich|Polska|Slovenija|România)\b/i.test(text);
}

export const BG_DELIVERY_CITY_RE =
  /Praha|Sofia|Brno|Plovdiv|Ostrava|Varna|Plzeň|Burgas|Liberec|Ruse|Olomouc|Stara Zagora/i;

export function hasBgDeliveryCities(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  return BG_DELIVERY_CITY_RE.test(text);
}

export const RO_DELIVERY_CITY_RE = BG_DELIVERY_CITY_RE;
export const hasRoDeliveryCities = hasBgDeliveryCities;
export const hasChDeliveryCities = hasBgDeliveryCities;

export function hasPolishDeliveryLeak(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const lower = text.toLowerCase();
  const mentionsPoland =
    /\bpolsce\b|\bcałej polski\b|\bna terenie całej polski\b|\bdostawa i płatność w polsce\b/i.test(
      lower,
    );
  return mentionsPoland && !hasBgDeliveryCities(text);
}
