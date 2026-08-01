// Clean noisy brand/title strings from affiliate feeds.
import { getCategoryDescriptorByLang } from "./category-descriptors";
import { factsForKind } from "./product-facts";
import { formLabelSl } from "./product-facts.cs-labels";
import { getNicheType } from "./niche-types";
import { inferProductRoleCs } from "./product-role.cs";
import { normalizeDescriptorTail } from "./title-translate.cs";
import { problemRoleForShelf } from "./problem-vocabulary.cs";
import { potencyRoleForForm, POTENCY_ROLE_DEFAULT, POTENCY_DESCRIPTOR_SHORT } from "./potency-vocabulary.cs";
import { applyStaticCyrillicTailDe, CYRILLIC_TEXT_RE } from "./cyrillic-tail-de";
import { transliterateAscii } from "./slugify";
import type { Lang } from "./lang";
// e.g. "Arthovix Meridian для суставов 139 руб (статик)" → "Arthovix Meridian".
//      "Электрический очиститель косметических кистей для макияжа" → preserved (no marketing junk).
//
// Strategy:
// 1. strip parens / brackets content (статик, динамик, новый, [6], …)
// 2. strip trailing payout markers: "139 руб", "0 грн", "$10", "5 usd", "RUB 100" …
// 3. strip "static/dynamic/статик/динамик" trailing markers
// 4. strip leading "[N]" tags and stray bullets
// 5. strip trailing geo codes: " UA", " RU", " UAH", " HOLD", " FREE"
// 6. collapse whitespace
// 7. cut off " для …", " з …", " с …" tails ONLY if the cleaned core has ≥2 words
//    (avoid destroying short descriptive names where the descriptor IS the name).

const PARENS_RE = /[\[(（【][^\])）】]*[\])）】]/g;
const PAYOUT_TAIL_RE = /\s+\d+\s*(руб|rub|грн|uah|usd|eur|ron|lei|₽|€|\$)\b.*/i;
const PAYOUT_PREFIX_RE = /\s+(руб|rub|грн|uah|usd|eur|ron|lei)\s*\d+\b.*/i;
const STATIC_DYNAMIC_RE = /\s*\b(стат[ия]к|дин[ая]м[ия]к|static|dynamic)\b.*/i;
/** Trailing geo/status codes — space-delimited only (never strip inside brand words). */
const GEO_HOLD_TAIL_RE =
  /\s+(?:FREE|HOLD|NEW|TOP|VIP|UA|UAH|RU|KZ|BY|IN|EN|UK|PL|RUS|KAZ|BLR|DE|FR|CH|BE|NL|CZ|SK|HU|RO|BG|GR|PT|SE|NO|DK|FI|IE)\s*$/i;
const LEAD_TAG_RE = /^\s*[\[(]\s*\d+\s*[\])]\s*/;
const NON_LETTER_TAIL_RE = /[\s,;:\-—|.·•]+$/u;

/** Remove garbage suffixes/prefixes from a product title. */
export function cleanBrandName(input: string): string {
  if (!input) return input;
  let s = String(input);

  // 1. strip lead "[N]" / "(N)"
  s = s.replace(LEAD_TAG_RE, "");

  // 2. strip ALL paren/bracket content (multi-pass for nested)
  for (let i = 0; i < 3; i++) {
    const next = s.replace(PARENS_RE, " ");
    if (next === s) break;
    s = next;
  }

  // 3. strip "X руб/грн/…" + trailing junk
  s = s.replace(PAYOUT_TAIL_RE, "");
  s = s.replace(PAYOUT_PREFIX_RE, "");

  // 4. strip "статик/динамик/static/dynamic" + tail
  s = s.replace(STATIC_DYNAMIC_RE, "");

  // 4b. strip everything after a pipe — pipes in affiliate feed titles are
  //     always a technical marker (e.g. "Brand - desc | бесплатно",
  //     "Brand | FREE", "Brand | KZ"), never part of the brand name.
  const pipeIdx = s.indexOf("|");
  if (pipeIdx > 0) s = s.slice(0, pipeIdx);

  // 5. repeatedly strip trailing geo / status codes (space-delimited only)
  for (let i = 0; i < 4; i++) {
    const next = s.replace(GEO_HOLD_TAIL_RE, "").replace(/\s{2,}/g, " ").trim();
    if (next === s) break;
    s = next;
  }

  // 6. collapse whitespace and trailing punctuation
  s = s.replace(/\s{2,}/g, " ").trim().replace(NON_LETTER_TAIL_RE, "").trim();

  // 7. cut dash-separated tail when it's clearly a descriptor, not a brand
  //    suffix. Two patterns are treated as junk:
  //      a) classic CPA junk: digits, FREE/HOLD/UA, single short token after dash
  //      b) descriptor tail: head is a single Title/UPPER-case brand-looking
  //         token AND tail starts with a lowercase service word
  //         ("капсулы", "крем", "для", "от", "kapsuly", …). This catches
  //         "Уровельмин - капсулы от простатита", "PotentGuard - капсулы …".
  const dashMatch = s.match(/^(.+?)\s+[–—-]\s+(.+)$/u);
  if (dashMatch) {
    const head = dashMatch[1].trim();
    const tail = dashMatch[2].trim();
    const tailIsCpaJunk =
      /\d/.test(tail) ||
      /\b(FREE|HOLD|NEW|TOP|VIP|UA|UAH|RU|KZ|BY|IN|EN|UK|PL|RUS|KAZ|BLR|DE|FR|CH|BE|NL|CZ|SK|HU|RO|BG|GR|PT|SE|NO|DK|FI|IE|стат[ия]к|дин[ая]м[ия]к|static|dynamic)\b/i.test(tail) ||
      // single short Latin/Cyrillic token after dash = brand suffix
      /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ][\w-]{1,30}$/u.test(tail);
    const headLooksLikeBrand =
      head.split(/\s+/).length <= 2 &&
      /^[A-ZА-ЯЁІЇЄҐ][A-Za-zА-Яа-яЁёІіЇїЄєҐґ0-9-]*$/u.test(head.split(/\s+/)[0]);
    const headAllLatin =
      head.split(/\s+/).length >= 1 &&
      head.split(/\s+/).every((t) => /^[A-Za-z][A-Za-z0-9\-+']*$/.test(t));
    const tailLooksLikeDescriptor =
      /^(?:[а-яёіїєґ]|для |от |від |з |с |и |та |и |на |по )/iu.test(tail);
    if ((tailIsCpaJunk && head.split(/\s+/).length >= 2) ||
        (headLooksLikeBrand && tailLooksLikeDescriptor) ||
        (headAllLatin && CYRILLIC_TEXT_RE.test(tail))) {
      s = head;
    }
  }

  // 8. final cleanup + sanity
  s = s.replace(NON_LETTER_TAIL_RE, "").replace(/\s{2,}/g, " ").trim();
  if (s.length < 3) {
    // fall back to first 4 tokens of the original
    return input.split(/\s+/).slice(0, 4).join(" ").trim();
  }
  return s;
}

// ---------------------------------------------------------------------------
// Lightweight RU → UK fallback for product titles on the Ukrainian site.
// Used when display_title_uk is not yet populated by the AI backfill so cards
// don't show raw Russian feed names. Order matters: longer phrases first.
// ---------------------------------------------------------------------------

const RU_UK_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  // multi-word phrases first
  [/пончо\s+с\s+подогревом/giu, "пончо з підігрівом"],
  [/с\s+эффектом\s+капрона/giu, "з ефектом капрону"],
  [/с\s+эффектом/giu, "з ефектом"],
  [/с\s+подогревом/giu, "з підігрівом"],
  [/с\s+капюшоном/giu, "з капюшоном"],
  [/для\s+макияжа/giu, "для макіяжу"],
  [/для\s+волос/giu, "для волосся"],
  [/для\s+мужчин/giu, "для чоловіків"],
  [/для\s+женщин/giu, "для жінок"],
  [/для\s+суставов/giu, "для суглобів"],
  // adjectives
  [/Трендовые/g, "Трендові"],
  [/трендовые/g, "трендові"],
  [/Женские/g, "Жіночі"],
  [/женские/g, "жіночі"],
  [/Женский/g, "Жіночий"],
  [/женский/g, "жіночий"],
  [/Женская/g, "Жіноча"],
  [/женская/g, "жіноча"],
  [/Мужские/g, "Чоловічі"],
  [/мужские/g, "чоловічі"],
  [/Мужской/g, "Чоловічий"],
  [/мужской/g, "чоловічий"],
  [/Летние/g, "Літні"],
  [/летние/g, "літні"],
  [/Летний/g, "Літній"],
  [/летний/g, "літній"],
  [/Летняя/g, "Літня"],
  [/летняя/g, "літня"],
  [/Зимние/g, "Зимові"],
  [/зимние/g, "зимові"],
  [/Зимний/g, "Зимовий"],
  [/зимний/g, "зимовий"],
  [/Утепленные/g, "Утеплені"],
  [/утепленные/g, "утеплені"],
  [/Утепленный/g, "Утеплений"],
  [/утепленный/g, "утеплений"],
  [/Беспроводной/g, "Бездротовий"],
  [/беспроводной/g, "бездротовий"],
  [/Электрический/g, "Електричний"],
  [/электрический/g, "електричний"],
  // nouns
  [/кеды/g, "кеди"],
  [/Кеды/g, "Кеди"],
  [/сандалии/g, "сандалі"],
  [/Сандалии/g, "Сандалі"],
  [/колготки/g, "колготки"],
  [/Очиститель/g, "Очищувач"],
  [/очиститель/g, "очищувач"],
  [/Массажер/g, "Масажер"],
  [/массажер/g, "масажер"],
  [/кистей/g, "пензликів"],
  [/кисти/g, "пензлики"],
  [/косметических/g, "косметичних"],
  [/водонепроницаемая/giu, "водонепроникна"],
  [/Водонепроницаемая/g, "Водонепроникна"],
  [/водонепроницаемый/giu, "водонепроникний"],
  [/Водонепроницаемый/g, "Водонепроникний"],
  [/водонепроницаемое/giu, "водонепроникне"],
  [/хранения/giu, "зберігання"],
  [/хранение/giu, "зберігання"],
  [/инструментов/giu, "інструментів"],
  [/инструменты/giu, "інструменти"],
  [/инструмент/giu, "інструмент"],
  [/переноски/giu, "перенесення"],
  [/переноска/giu, "перенесення"],
  [/практичная/giu, "практична"],
  [/практичный/giu, "практичний"],
  [/удобная/giu, "зручна"],
  [/удобный/giu, "зручний"],
  // prepositions / fillers — applied last
  [/\bдля\b/g, "для"], // same in UK; no-op safety
  [/\bи\b/g, "та"],
];

// Russian-only markers that signal the string is still raw Russian feed text.
const RU_MARKERS_RE = /(женск|мужск|летн|зимн|утеплен|трендов|подогрев|капюшон|эффект|кеды|сандалии|колготки|беспровод|массажер|очиститель|косметическ|кист[ие]|водонепрон|сумк|инструмент|хранен|перенос|практичн|удобн|электрич)/i;

/** True when Cyrillic text still looks Russian (not yet UK-translated). */
export function looksRussianCyrillic(text: string): boolean {
  if (!text || !CYRILLIC_TEXT_RE.test(text)) return false;
  if (/[ёыэъ]/iu.test(text)) return true;
  if (/(?:ый|ий|ая|ое|ые|ого|ому|ему|ами|ями|ения|ение|ования)\b/iu.test(text)) return true;
  return RU_MARKERS_RE.test(text);
}

const CATEGORY_SHORT_SUFFIX_RE =
  /\s+[-—–]\s+(аксесуар|аксессуар|товар|засіб|засоб|прилад|гаджет|побутов\w*|бьюти\w*|бʼюті\w*)\s*$/iu;

/** Strip trailing category descriptor suffixes (e.g. "… — аксесуар") from H1. */
export function stripCategoryShortSuffix(title: string): string {
  if (!title) return title;
  return title.replace(CATEGORY_SHORT_SUFFIX_RE, "").trim();
}

/** Heuristic fallback: convert common Russian product-name fragments to Ukrainian. */
export function ruToUkFallback(input: string): string {
  if (!input) return input;
  if (!CYRILLIC_TEXT_RE.test(input)) return input;
  if (!RU_MARKERS_RE.test(input) && !looksRussianCyrillic(input)) return input;
  let s = input;
  for (const [re, repl] of RU_UK_REPLACEMENTS) s = s.replace(re, repl);
  return s.replace(/\s{2,}/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Unified product-title normalizer used by every affiliate-feed importer
// AND by the AI content layer. Single source of truth for title hygiene.
// Pipeline: drop English descriptor after dash → strip marketing/geo tags
// (FREE, HOLD, NEW, UA, RU…) → cleanBrandName (payout, parens, "[N]", tails).
// ---------------------------------------------------------------------------

/** Strip affiliate-feed marketing/geo markers — space-delimited tokens only. */
export function stripFeedMarkers(input: string): string {
  if (!input) return input;
  let s = String(input);
  const sep = s.search(/\s[-—–]\s/);
  if (sep > 0) s = s.slice(0, sep);
  return stripDelimitedFeedMarkers(s);
}

/**
 * Canonical product-title normalizer. Use this everywhere a raw affiliate
 * title is about to be shown to a user or sent to AI — including new
 * partner integrations added in the future.
 */
export function normalizeProductTitle(input: string | null | undefined): string {
  if (!input) return "";
  const s = stripFeedMarkers(String(input));
  const locked = extractLockedLatinBrand(s);
  if (locked) {
    const remainder = s.slice(locked.length).trim();
    const cleanedTail = remainder
      ? stripAffiliateSkuTokens(cleanBrandName(remainder)).trim()
      : "";
    return cleanedTail ? `${locked} ${cleanedTail}`.trim() : locked;
  }
  return stripAffiliateSkuTokens(cleanBrandName(s));
}

/**
 * Leading commercial brand span from a raw feed title.
 * Preserves multi-word Latin names (Smoke No More, Toxic OFF) while stopping at affiliate suffixes (DE, EU LOW).
 */
export function extractLockedLatinBrand(rawTitle: string | null | undefined): string {
  if (!rawTitle?.trim()) return "";
  let s = String(rawTitle).trim();
  const pipeIdx = s.indexOf("|");
  if (pipeIdx > 0) s = s.slice(0, pipeIdx);
  s = s.replace(LEAD_TAG_RE, "").trim();
  s = stripFeedMarkers(s);
  const cleaned = cleanFeedTitleWithDescriptor(s) || s;
  const { brand } = splitBrandAndTail(cleaned);
  return brand.trim();
}

// ---------------------------------------------------------------------------
// New H1 pipeline (v43): keep BOTH brand and descriptor tail from the feed,
// strip only CPA/marketing noise. Used as canonical H1 source so the
// product page no longer has to append a category descriptor.
// ---------------------------------------------------------------------------

const JUNK_WORD_RE =
  /(?<![\p{L}\p{N}])(?:безкоштовно|бесплатно|консультац(?:ия|ія)|consultation|доставка|promo|promotion|акц(?:ия|ія)|sale|hot|стат[ия]к|дин[ая]м[ия]к|static|dynamic)(?![\p{L}\p{N}])/giu;
/** Lowercase-only marketing tokens — do not strip Title Case words inside brand names (No, New, Top, Free). */
const JUNK_WORD_LOWER_RE =
  /(?<![\p{L}\p{N}])(?:free|hold|new|top|vip|hot|sale)(?![\p{L}\p{N}])/gu;
const PAYOUT_AMOUNT_RE =
  /(?<![\p{L}\p{N}])\d{1,5}\s*(?:руб\.?|rub|грн\.?|uah|usd|eur|ron|lei|bgn|₽|€|\$)(?![\p{L}\p{N}])/giu;
const PAYOUT_PREFIX_AMOUNT_RE =
  /(?<![\p{L}\p{N}])(?:руб\.?|rub|грн\.?|uah|usd|eur|ron|lei|bgn|₽|€|\$)\s*\d{1,5}(?![\p{L}\p{N}])/giu;
const TRAILING_BARE_NUM_RE = /(?:\s|^)\d{2,5}\s*$/u;

/** Geo + affiliate markers stripped only when space- or paren-delimited. */
const DELIMITED_GEO_2LETTER =
  "EU|ES|IT|SI|AT|PL|FR|CH|BE|NL|CZ|SK|HU|RO|BG|GR|PT|SE|NO|DK|FI|IE|UA|RU|KZ|BY|IN|EN|UK|DE";
const DELIMITED_AFFILIATE_3PLUS =
  "UAH|RUS|KAZ|BLR|LOW|HIGH|PRICE|TOP|VIP|NEW|HOLD|FREE|FULLPRICE|V\\d+(?:\\.\\d+)?|2\\.0|3\\.0";

/** Two-letter geo codes — uppercase only (preserve «No» in Smoke No More). */
const DELIMITED_SPACE_GEO_2_RE = new RegExp(
  `(?:^|\\s)(?:${DELIMITED_GEO_2LETTER})(?=\\s|$|[.,;:|])`,
  "g",
);
const DELIMITED_PAREN_GEO_2_RE = new RegExp(
  `[\\[(\\{]\\s*(?:${DELIMITED_GEO_2LETTER})\\s*[\\])\\}]`,
  "g",
);
/** Longer markers — case-insensitive when space/paren-delimited. */
const DELIMITED_SPACE_MARKERS_3_RE = new RegExp(
  `(?:^|\\s)(?:${DELIMITED_AFFILIATE_3PLUS})(?=\\s|$|[.,;:|])`,
  "gi",
);
const DELIMITED_PAREN_MARKERS_3_RE = new RegExp(
  `[\\[(\\{]\\s*(?:${DELIMITED_AFFILIATE_3PLUS})\\s*[\\])\\}]`,
  "gi",
);
const DELIMITED_COMPOUND_SPACE_RE =
  /(?:^|\s)(?:FullPrice|FULLPRICE|Full\s*Price|FULL\s*PRICE|HighPrice|LowPrice|HIGHPRICE|LOWPRICE)(?=\s|$|[.,;:|])/gi;
const DELIMITED_CI_SPACE_RE =
  /(?:^|\s)(?:low|high|price|top|vip|new|hold|free)(?=\s|$|[.,;:|])/giu;

/**
 * Strip CPA geo/affiliate markers only when delimited by spaces or brackets.
 * Never strips substrings inside brand words (INSPICURE, PROSTALIS, GRAVITAL+, …).
 */
export function stripDelimitedFeedMarkers(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input);
  for (let i = 0; i < 4; i++) {
    const next = s
      .replace(DELIMITED_PAREN_GEO_2_RE, " ")
      .replace(DELIMITED_PAREN_MARKERS_3_RE, " ")
      .replace(DELIMITED_COMPOUND_SPACE_RE, " ")
      .replace(DELIMITED_SPACE_GEO_2_RE, " ")
      .replace(DELIMITED_SPACE_MARKERS_3_RE, " ")
      .replace(DELIMITED_CI_SPACE_RE, " ")
      .replace(/\s+low\s+low\b/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (next === s) break;
    s = next;
  }
  return s.replace(NON_LETTER_TAIL_RE, "").trim();
}

/** @deprecated use stripDelimitedFeedMarkers */
export function stripAffiliateSkuTokens(input: string | null | undefined): string {
  return stripDelimitedFeedMarkers(input);
}

/** True when feed tail is only a price/currency token (e.g. «119 BGN», «BGN 119»). */
export function isPriceOnlyTail(tail: string | null | undefined): boolean {
  const t = String(tail ?? "").trim();
  if (!t) return false;
  if (/^\d{1,6}(?:\s*(?:ron|lei|rub|eur|usd|uah|₽|€|\$))?$/iu.test(t)) return true;
  if (/^(?:ron|lei|rub|eur|usd|uah|₽|€|\$)\s*\d{1,6}$/iu.test(t)) return true;
  const cleaned = sanitizeDisplayTitleTail(t);
  return cleaned.length === 0 && /\d/.test(t);
}

function stripHangingTitleSeparator(s: string): string {
  return s
    .replace(/\s*[—–-]\s*$/u, "")
    .replace(/^\s*[—–-]\s*/u, "")
    .trim();
}

const AFFILIATE_SKU_TOKEN_SINGLE_RE =
  /^(?:EU|ES|IT|SI|AT|PL|FR|CH|BE|NL|CZ|SK|HU|RO|BG|GR|PT|SE|NO|DK|FI|IE|UA|UAH|RU|KZ|BY|IN|EN|UK|RUS|KAZ|BLR|DE|LOW|HIGH|PRICE|TOP|VIP|NEW|HOLD|FREE|FULLPRICE|FullPrice|V\d+(?:\.\d+)?|2\.0|3\.0)$/i;

/** True when a whole space-delimited token is an affiliate feed marker (EU, IT, LOW, …). */
export function isAffiliateSkuToken(token: string): boolean {
  if (!token) return false;
  if (/^(?:FullPrice|FULLPRICE|Full\s*Price|FULL\s*PRICE|HighPrice|LowPrice|HIGHPRICE|LOWPRICE)$/i.test(token)) {
    return true;
  }
  if (!AFFILIATE_SKU_TOKEN_SINGLE_RE.test(token)) return false;
  // Title Case fragments inside multi-word brands (Smoke No More) are not geo codes.
  if (token.length <= 3 && token !== token.toUpperCase()) return false;
  return true;
}

/** True when input still contains space- or paren-delimited affiliate/geo markers. */
export function containsAffiliateSkuTokens(input: string | null | undefined): boolean {
  if (!input) return false;
  const s = String(input);
  if (/\slow\s+low\b/i.test(s)) return true;
  return (
    DELIMITED_SPACE_GEO_2_RE.test(s) ||
    DELIMITED_PAREN_GEO_2_RE.test(s) ||
    DELIMITED_SPACE_MARKERS_3_RE.test(s) ||
    DELIMITED_PAREN_MARKERS_3_RE.test(s) ||
    DELIMITED_COMPOUND_SPACE_RE.test(s) ||
    DELIMITED_CI_SPACE_RE.test(s)
  );
}

/**
 * Clean a raw feed title while preserving its descriptor tail.
 * Strips bracket content, payouts, marketing/geo tokens, junk words,
 * and everything after a pipe. Brand + descriptor remain intact.
 */
export function cleanFeedTitleWithDescriptor(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input);

  const pipeIdx = s.indexOf("|");
  if (pipeIdx > 0) s = s.slice(0, pipeIdx);

  s = s.replace(LEAD_TAG_RE, "");

  for (let i = 0; i < 3; i++) {
    const next = s.replace(PARENS_RE, " ");
    if (next === s) break;
    s = next;
  }

  s = s.replace(PAYOUT_AMOUNT_RE, " ").replace(PAYOUT_PREFIX_AMOUNT_RE, " ");

  for (let i = 0; i < 3; i++) {
    const next = s.replace(JUNK_WORD_RE, " ").replace(JUNK_WORD_LOWER_RE, " ");
    if (next === s) break;
    s = next;
  }

  s = stripDelimitedFeedMarkers(s);

  s = s
    .replace(/[·•]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(TRAILING_BARE_NUM_RE, "")
    .replace(NON_LETTER_TAIL_RE, "")
    .replace(/^[\s,;:\-—|.·•]+/u, "")
    .trim();

  if (s.length < 1) {
    return String(input).split(/\s+/).slice(0, 6).join(" ").trim();
  }
  return s;
}

/** Sanitize descriptor tail only — prices, junk, delimiter-bound geo markers. */
function sanitizeDisplayTitleTail(input: string): string {
  if (!input) return "";
  let s = String(input);

  for (let i = 0; i < 3; i++) {
    const next = s.replace(PARENS_RE, " ");
    if (next === s) break;
    s = next;
  }
  const pipeIdx = s.indexOf("|");
  if (pipeIdx > 0) s = s.slice(0, pipeIdx);

  for (let i = 0; i < 3; i++) {
    const before = s;
    s = s
      .replace(PAYOUT_AMOUNT_RE, " ")
      .replace(PAYOUT_PREFIX_AMOUNT_RE, " ")
      .replace(JUNK_WORD_RE, " ")
      .replace(JUNK_WORD_LOWER_RE, " ");
    s = stripDelimitedFeedMarkers(s);
    if (s === before) break;
  }

  s = s
    .replace(/[·•]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  for (let i = 0; i < 2; i++) {
    const next = s.replace(TRAILING_BARE_NUM_RE, "").trim();
    if (next === s) break;
    s = next;
  }

  s = s
    .replace(NON_LETTER_TAIL_RE, "")
    .replace(/^[\s,;:\-—|.·•]+/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return stripHangingTitleSeparator(normalizeDescriptorTail(s));
}

/**
 * Light cleaner for display titles: brand prefix is kept verbatim;
 * only the descriptor tail (after em/en dash) is scrubbed.
 */
export function sanitizeDisplayTitle(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = String(input).trim();
  const dashMatch = trimmed.match(/^(.+?)\s+([—–-])\s+(.+)$/su);
  if (dashMatch) {
    const brand = dashMatch[1].trim();
    const sep = dashMatch[2];
    const cleanedTail = sanitizeDisplayTitleTail(dashMatch[3]);
    if (!cleanedTail) return brand;
    return `${brand} ${sep} ${cleanedTail}`.replace(/\s{2,}/g, " ").trim();
  }
  return sanitizeDisplayTitleTail(trimmed);
}

// Latin CPA brand tokens recognised anywhere in a mixed-script feed title.
const KNOWN_CPA_BRANDS = [
  "shiseydo", "shiseido", "luvexan", "revidermis", "liftensyn", "potentguard",
  "urovelmin", "neoprost", "gelmiforte", "bactefort", "bactiolin",
  "arthovix", "erektobust", "potenex", "vigrandex", "maxeron", "braverol",
  "libidov", "miconef", "micosave", "rectosave", "optilix", "oftilex", "oculminex",
  "skineform", "liposize", "metabalance", "platinus", "norvistop", "tribulus",
  "alphademix", "maralgel", "boostella", "flebonol", "tromblexan", "valgofix",
  "tabex", "gelmiv", "farmacin", "parazil", "toxilife", "pansiton", "stomaclacte",
  "санацин", "sanacin", "urinodelf", "уринастоп", "lumevita", "menolid", "avaler",
  "prostan", "potenstrong", "redmachine", "potenup", "potenlex", "ericil",
  "уретрокс", "uretrox", "otofonex", "ларинорм", "larinorm", "psorilite",
  "venzen", "goodly", "fvo", "sadoer", "epilage",
];

const LATIN_TOKEN_RE = /[A-Za-z][A-Za-z0-9\-+']*/g;

/** Latin brand word, optional single trailing dot (Dr., Prof.) */
const LATIN_BRAND_TOKEN_RE = /^[A-Za-z][A-Za-z0-9\-+']*\.?$/;

/** Dr.Derm → Dr. Derm before brand tokenization. */
function normalizeHonorificBrandSpacing(input: string): string {
  return input.replace(/\b((?:Dr|Mr|Mrs|Ms|Prof))\.(?=[A-Za-z])/gi, "$1. ");
}

const LATIN_DESCRIPTOR_STOP = new Set([
  "cream", "serum", "joint", "care", "treatment", "support", "health", "plus",
  "max", "ultra", "super", "extra", "new", "hot", "free", "hold",
  "anti", "aging", "rejuvenating", "skin", "hair", "loss", "growth",
]);

/** Remove brand token(s) from anywhere in a title string. */
function removeBrandTokens(text: string, brand: string): string {
  if (!brand) return text;
  let result = text;
  for (const part of brand.split(/\s+/)) {
    const esc = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "giu"), " ");
  }
  return result
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^[-–—:,|·]+\s*/u, "")
    .replace(/[\s,;:\-—|.·•]+$/u, "")
    .trim();
}

/**
 * Extract embedded Latin brand token(s) from any position in a feed title.
 * Handles mixed-script feeds like `Крем Shiseydo+ для омоложения`.
 */
export function extractEmbeddedLatinBrand(
  title: string,
  feedBrandHint?: string,
): string {
  if (!title) return "";
  const spaced = normalizeHonorificBrandSpacing(title);
  const tokens = spaced.match(LATIN_TOKEN_RE) ?? [];
  if (tokens.length === 0) return "";

  const honorific = spaced.match(
    /(?:^|\s)((?:Dr|Mr|Mrs|Ms|Prof))\.?\s*([A-Za-z][A-Za-z0-9\-+']{2,})\b/i,
  );
  if (honorific?.[1] && honorific[2]) return `${honorific[1]}. ${honorific[2]}`.trim();

  if (feedBrandHint) {
    const cleanedHint = stripAffiliateSkuTokens(feedBrandHint);
    const hintTokens = cleanedHint.match(LATIN_TOKEN_RE) ?? [];
    for (const t of hintTokens) {
      const norm = t.toLowerCase();
      if (isAffiliateSkuToken(t)) continue;
      if (norm.length < 3) continue;
      if (LATIN_DESCRIPTOR_STOP.has(norm)) continue;
      if (title.toLowerCase().includes(t.toLowerCase())) return t;
    }
  }

  const lower = title.toLowerCase();
  for (const known of KNOWN_CPA_BRANDS) {
    if (!lower.includes(known)) continue;
    const re = new RegExp(known.replace(/\+/g, "\\+"), "i");
    const m = title.match(re);
    if (m) {
      const rest = title.slice((m.index ?? 0) + m[0].length);
      const tier = rest.match(/^\s+(PRO|MAX|PLUS|ULTRA)\b/i);
      if (tier) return `${m[0]}${tier[0]}`.trim();
      return m[0];
    }
  }

  const plusToken = tokens.find((t) => t.endsWith("+") && t.length >= 4);
  if (plusToken) return plusToken;

  for (const t of tokens) {
    const norm = t.toLowerCase();
    if (norm.length < 4) continue;
    if (LATIN_DESCRIPTOR_STOP.has(norm)) continue;
    if (/^[A-Z][a-z]/.test(t) || /^[A-Z]{2,}$/.test(t)) return t;
  }

  return "";
}

/** Latin brand tokens present in a display title (for UK/RU parity checks). */
export function getLatinBrandTokens(text: string): string[] {
  return (text.match(LATIN_TOKEN_RE) ?? [])
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 3 || /\+/.test(t));
}

/** First meaningful Latin token from a display title (SEO brand anchor). */
export function firstLatinToken(
  displayTitle: string,
  feedBrand?: string,
): string {
  const embedded = extractEmbeddedLatinBrand(displayTitle, feedBrand);
  if (embedded) return embedded;
  const tokens = displayTitle.match(LATIN_TOKEN_RE) ?? [];
  for (const t of tokens) {
    const norm = t.toLowerCase();
    if (norm.length < 3) continue;
    if (LATIN_DESCRIPTOR_STOP.has(norm)) continue;
    return t;
  }
  return "";
}

const BRAND_CANON_RU: Record<string, string> = {
  shiseydo: "Shiseido",
  shiseido: "Shiseido",
};

/** Optional RU canonicalisation for common feed typos (Latin preserved). */
export function canonicalizeBrandForRu(brand: string): string {
  if (!brand) return brand;
  const hasPlus = brand.endsWith("+");
  const core = hasPlus ? brand.slice(0, -1) : brand;
  const canon = BRAND_CANON_RU[core.toLowerCase()];
  if (canon) return hasPlus ? `${canon}+` : canon;
  return brand;
}

function joinBrandAndTail(brand: string, tail: string): string {
  return brand ? (tail ? `${brand} - ${tail}` : brand) : tail;
}

function joinCanonicalHeadline(brand: string, tail: string): string {
  if (!brand) return normalizeDescriptorTail(tail);
  const flatTail = normalizeDescriptorTail(tail);
  if (!flatTail) return brand.trim();
  return `${brand.trim()} — ${flatTail}`;
}

function tokensTranslitEqual(a: string, b: string): boolean {
  const na = transliterateAscii(a);
  const nb = transliterateAscii(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function isTailDuplicateOfBrand(brand: string, tail: string): boolean {
  const t = tail.trim();
  if (!t) return true;
  const b = brand.trim();
  if (!b) return false;
  if (t.toLowerCase() === b.toLowerCase()) return true;
  if (tokensTranslitEqual(t, b)) return true;
  return !removeBrandTokens(t, b).trim();
}

const HEADLINE_DUP_RE = /^(.+?)\s*[-–—]\s*\1\s*$/iu;

/** Detect headlines like «Brand — Brand» (exact or translit-equal halves). */
export function isHeadlineDuplicateBrand(title: string): boolean {
  const s = (title ?? "").trim();
  if (!s) return false;
  if (HEADLINE_DUP_RE.test(s)) return true;
  const parts = s.split(/\s*[-–—]\s+/u);
  if (parts.length !== 2) return false;
  const [left, right] = parts.map((p) => p.trim());
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase() || tokensTranslitEqual(left, right);
}

export function extractFirstH2Text(html: string): string {
  const m = (html ?? "").match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function roleFormClass(text: string): "oral" | "topical" | "tea" | null {
  const lc = text.toLowerCase();
  if (/\bgel\b|gelenkgel|creme|salbe|spray|topisch|äußer/i.test(lc)) return "topical";
  if (/\btee\b|kräutert|aufguss/i.test(lc)) return "tea";
  if (/\bkapseln\b|tabletten|tropfen|kapsel\b/i.test(lc)) return "oral";
  return null;
}

function roleOverridesTail(workTail: string, inferredRole: string | null): string {
  if (!workTail.trim() || !inferredRole?.trim()) return workTail;
  const tailClass = roleFormClass(workTail);
  const roleClass = roleFormClass(inferredRole);
  if (!tailClass || !roleClass || tailClass === roleClass) return workTail;
  return inferredRole;
}

function buildDescriptorTail(
  lang: Lang,
  categorySlug: string,
  formKind: string | null | undefined,
): string {
  const d = getCategoryDescriptorByLang(categorySlug, lang);
  const catPart = (d?.short ?? "").trim();
  const niche = getNicheType(categorySlug);
  const nonMedicalNiche =
    niche === "auto" || niche === "fashion" || niche === "home" || niche === "garden";

  if (nonMedicalNiche) return catPart;

  const facts = factsForKind(formKind);
  const isGeneric = !formKind || formKind === "unknown" || formKind === "generic_item";
  const formLabel =
    !isGeneric && facts
      ? (lang === "ru" ? facts.formLabelRu : formLabelSl(facts))?.trim() || undefined
      : undefined;

  if (!isGeneric && facts && formLabel) {
    if (categorySlug === "potence") {
      return potencyRoleForForm(formLabel);
    }
    if (catPart) return `${formLabel} ${catPart}`;
    return formLabel;
  }

  if (categorySlug === "potence") {
    return catPart === POTENCY_DESCRIPTOR_SHORT ? POTENCY_ROLE_DEFAULT : catPart || POTENCY_ROLE_DEFAULT;
  }

  const shelfRole = problemRoleForShelf(categorySlug, formLabel, formKind);
  if (shelfRole) return shelfRole;

  return catPart;
}

export type CanonicalHeadlineInput = {
  brand: string;
  tail: string;
  lang: Lang;
  categorySlug: string;
  formKind?: string | null;
  /** Full feed title for title-first product role inference. */
  rawTitle?: string;
  /** Feed description snippet for role inference when title is thin. */
  feedSnippet?: string;
};

/** Locked brand for PDP H1 — strips Cyrillic tails even when feed brand is contaminated. */
export function resolveHeadlineBrand(feedBrand: string, rawTitle: string): string {
  const locked = extractLockedLatinBrand(rawTitle);
  if (locked) return locked;
  const cleaned = cleanFeedTitleWithDescriptor(rawTitle) || rawTitle;
  if (feedBrand?.trim() && !CYRILLIC_TEXT_RE.test(feedBrand)) {
    const scrubbed = extractLockedLatinBrand(feedBrand) || cleanBrandName(feedBrand);
    if (scrubbed && !CYRILLIC_TEXT_RE.test(scrubbed)) return scrubbed;
  }
  const fromTitle = cleanBrandName(cleaned);
  if (fromTitle && !CYRILLIC_TEXT_RE.test(fromTitle)) return fromTitle;
  const { brand } = splitBrandAndTail(cleaned);
  return brand || fromTitle || feedBrand.trim() || cleaned;
}

/** Collapse brand for comparison — strip spaces, dashes, plus. */
export function compactBrandLetters(input: string): string {
  return String(input ?? "")
    .replace(/[\s\-—–+]/g, "")
    .toUpperCase();
}

/** Legacy in-word geo codes stripped by the old sanitizeDisplayTitle post-processor. */
const LEGACY_EMBEDDED_GEO_CODES = [
  "UA", "IT", "RO", "DE", "IN", "EN", "NO", "AT", "ES", "FR", "PL", "SK", "HU", "BG", "GR", "PT",
  "SE", "DK", "FI", "IE", "UK", "RU", "KZ", "BY", "US", "NL", "CH", "BE", "CZ", "SI", "LT", "LV",
  "EE", "HR", "RS", "BA", "MK", "MD", "GE", "AM", "AZ",
] as const;

/** Simulate legacy in-word geo strip (PROSTALIS → P STALIS, GUAVITAL+ → G V AL+). */
export function simulateLegacyGeoStripInBrand(brand: string): string {
  let s = String(brand ?? "");
  for (const code of LEGACY_EMBEDDED_GEO_CODES) {
    s = s.replace(new RegExp(code, "gi"), " ");
  }
  return s.replace(/\s+/g, " ").trim();
}

function hasFragmentedLatinBrand(brand: string): boolean {
  const tokens = brand.trim().split(/\s+/);
  if (tokens.length < 2) return false;
  if (!tokens.every((t) => /^[A-Za-z][A-Za-z0-9\-+']*$/.test(t))) return false;
  const shortCount = tokens.filter((t) => t.replace(/\+$/u, "").length <= 3).length;
  return shortCount >= 1;
}

export type TruncatedBrandReason =
  | "geo_stripped"
  | "suffix_fragment"
  | "fragmented_latin"
  | "body_mismatch";

/**
 * True when a display brand looks like a geo-strip truncation of the feed brand
 * (P STALIS, G V AL+, SPICURE, …).
 */
export function isTruncatedDisplayBrand(
  displayBrand: string,
  feedBrand: string,
  rawTitle: string,
): boolean {
  const actual = displayBrand?.trim();
  const expected = resolveHeadlineBrand(feedBrand, rawTitle).trim();
  if (!actual || !expected) return false;
  if (CYRILLIC_TEXT_RE.test(expected) && !CYRILLIC_TEXT_RE.test(actual)) return false;

  const a = compactBrandLetters(actual);
  const e = compactBrandLetters(expected);
  if (a === e) return false;

  const simulated = compactBrandLetters(simulateLegacyGeoStripInBrand(expected));
  if (simulated === a) return true;

  // Shorter single-token brands only — avoids Fortunella vs «Fortunella Drops» false positives.
  if (!/\s/.test(expected) && !/\s/.test(actual)) {
    if (e.endsWith(a) && a.length >= 4 && a.length < e.length * 0.9) return true;
    if (e.startsWith(a) && a.length >= 2 && a.length < e.length * 0.85) return true;
  }

  if (!/\s/.test(expected) && hasFragmentedLatinBrand(actual) && simulated === a) return true;

  return false;
}

/** Classify why a stored display title brand diverges from the feed brand. */
export function truncatedBrandReason(
  displayTitle: string,
  feedBrand: string,
  rawTitle: string,
  opts?: { titleUk?: string | null; html?: string | null },
): TruncatedBrandReason | null {
  const { brand: actual } = splitBrandAndTail(displayTitle);
  if (!actual?.trim()) return null;
  const expected = resolveHeadlineBrand(feedBrand, rawTitle).trim();
  if (!isTruncatedDisplayBrand(actual, feedBrand, rawTitle)) return null;

  const e = compactBrandLetters(expected);
  const a = compactBrandLetters(actual);

  if (compactBrandLetters(simulateLegacyGeoStripInBrand(expected)) === a) {
    const blob = `${opts?.titleUk ?? ""} ${opts?.html ?? ""}`;
    if (blob.trim() && expected.length >= 3) {
      const wordRe = new RegExp(`\\b${expected.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const actualWordRe = new RegExp(`\\b${actual.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (wordRe.test(blob) && !actualWordRe.test(displayTitle)) return "body_mismatch";
    }
    return "geo_stripped";
  }
  if (!/\s/.test(expected) && !/\s/.test(actual) && (e.endsWith(a) || e.startsWith(a))) {
    return "suffix_fragment";
  }
  return "geo_stripped";
}

/**
 * Single source of truth for PDP H1: brand lock, tail dedup (incl. translit),
 * descriptor fallback from form + category when tail is empty or repeats brand.
 */
export function buildCanonicalHeadline(input: CanonicalHeadlineInput): string {
  const { brand, tail, lang, categorySlug, formKind, rawTitle, feedSnippet } = input;
  const lockedBrand = (lang === "ru" ? canonicalizeBrandForRu(brand) : brand).trim();

  let workTail = sanitizeDisplayTitle(removeBrandTokens(tail.trim(), brand));
  if (isTailDuplicateOfBrand(brand, workTail)) workTail = "";

  if (workTail && lang !== "ro" && CYRILLIC_TEXT_RE.test(workTail)) {
    workTail = applyStaticCyrillicTailDe(workTail);
  }
  if (workTail && CYRILLIC_TEXT_RE.test(workTail)) workTail = "";

  const inferHaystack = (title?: string) =>
    title?.trim() ? inferProductRoleCs(title, lockedBrand, feedSnippet) : null;

  if (workTail) {
    const inferred = inferHaystack(rawTitle);
    workTail = roleOverridesTail(workTail, inferred);
    const joined = joinCanonicalHeadline(lockedBrand, workTail);
    return sanitizeDisplayTitle(joined) || joined;
  }

  const inferred = inferHaystack(rawTitle);
  if (inferred) {
    const headline = joinCanonicalHeadline(lockedBrand, inferred);
    return sanitizeDisplayTitle(headline) || headline;
  }

  const descriptor = buildDescriptorTail(lang, categorySlug, formKind);
  if (!descriptor) return lockedBrand || sanitizeDisplayTitle(tail) || tail;

  const headline = joinCanonicalHeadline(lockedBrand, descriptor);
  return sanitizeDisplayTitle(headline) || headline;
}

/** Prepend a locked Latin brand when a display title lost it during translation. */
export function joinBrandToTitle(brand: string, title: string): string {
  if (!brand) return title;
  const normBrand = brand.toLowerCase();
  if (title.toLowerCase().includes(normBrand)) return title;
  if (!title.trim()) return brand;
  return joinBrandAndTail(brand, title);
}

export type DisplayTitleParityResult = {
  ok: boolean;
  reason?: string;
  uk?: string;
  ru?: string;
};

/**
 * Post-QA: if the raw feed contains a Latin brand, both UK and RU display
 * titles must contain the same brand token(s).
 */
export function assertDisplayTitleParity(
  uk: string,
  ru: string,
  rawTitle: string,
): DisplayTitleParityResult {
  const cleaned = cleanFeedTitleWithDescriptor(rawTitle) || rawTitle;
  const { brand } = splitBrandAndTail(cleaned);
  const embedded = extractEmbeddedLatinBrand(cleaned, brand);
  const lockedBrand = brand || embedded;
  if (!lockedBrand) return { ok: true };

  const brandNorm = lockedBrand.toLowerCase();
  const ukHas = uk.toLowerCase().includes(brandNorm);
  const ruHas = ru.toLowerCase().includes(brandNorm);
  if (ukHas && ruHas) return { ok: true };

  return {
    ok: false,
    reason: "brand-parity",
    uk: ukHas ? uk : joinBrandToTitle(lockedBrand, uk),
    ru: ruHas ? ru : joinBrandToTitle(canonicalizeBrandForRu(lockedBrand), ru),
  };
}

import type { PdpContentSlot } from "./market";

export type SpecBrandRow = { labelKey: "brand" | "productName"; value: string };

/** Resolve the specs-table brand row — brand token only, not the full H1 descriptor. */
export function resolveSpecBrandRow(
  offerBrand: string,
  displayTitle: string,
  formKind: string | null | undefined,
  _lang: PdpContentSlot,
): SpecBrandRow | null {
  const feedBrand = normalizeProductTitle(offerBrand) || offerBrand.trim();
  const cleaned = cleanFeedTitleWithDescriptor(displayTitle) || displayTitle;
  const { brand: splitBrand } = splitBrandAndTail(cleaned);
  const latin = firstLatinToken(displayTitle, feedBrand || splitBrand);
  const isGeneric = formKind === "generic_item" || formKind === "unknown" || !formKind;

  if (latin) {
    return { labelKey: "brand", value: latin };
  }
  if (splitBrand) {
    const value = _lang === "ru" ? canonicalizeBrandForRu(splitBrand) : splitBrand;
    return { labelKey: "brand", value };
  }
  if (feedBrand && feedBrand.length >= 2) {
    return { labelKey: "brand", value: feedBrand };
  }
  if (isGeneric) {
    return { labelKey: "productName", value: displayTitle };
  }
  return null;
}

export function splitBrandAndTail(title: string): { brand: string; tail: string } {
  if (!title) return { brand: "", tail: "" };
  const trimmed = normalizeHonorificBrandSpacing(title.trim());
  const tokens = trimmed.split(/\s+/);
  const brandTokens: string[] = [];
  for (const t of tokens) {
    if (LATIN_BRAND_TOKEN_RE.test(t) && !isAffiliateSkuToken(t)) {
      brandTokens.push(t);
    } else break;
  }
  if (brandTokens.length > 0) {
    const brand = brandTokens.join(" ");
    const tail = trimmed.slice(brand.length).trim().replace(/^[-–—:,|·]+\s*/u, "");
    return { brand, tail };
  }

  // Cyrillic-leading brand: must be followed by an explicit separator.
  const sepMatch = trimmed.match(/^(.+?)\s+[-–—|:·]\s+(.+)$/u);
  if (sepMatch) {
    const head = sepMatch[1].trim();
    const tail = sepMatch[2].trim();
    const headTokens = head.split(/\s+/);
    if (headTokens.length >= 1 && headTokens.length <= 3) {
      const looksLikeBrand = headTokens.every((t) =>
        /^[A-ZА-ЯЁІЇЄҐ][\p{L}\p{N}\-']*$/u.test(t) ||
        /^[A-ZА-ЯЁІЇЄҐ0-9\-]+$/u.test(t) ||
        /[\d-]/.test(t),
      );
      if (looksLikeBrand) return { brand: head, tail };
    }
  }

  const embedded = extractEmbeddedLatinBrand(trimmed);
  if (embedded) {
    const tail = removeBrandTokens(trimmed, embedded);
    return { brand: embedded, tail: tail || trimmed };
  }

  return { brand: "", tail: trimmed };
}

/** Hungarian Latin letters — words containing these are not English leaks. */
const HU_LATIN_LETTERS_RE = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;

/** Common HU product nouns in ASCII (no diacritics) — not English leaks. */
const HU_ASCII_DESCRIPTOR_ALLOWLIST = new Set([
  "szer", // elleni szer
  "eszkoz", // eszköz without diacritics
  "keszitmeny", // készítmény without diacritics
]);

/** LED-es, USB-s, WiFi-s — valid HU suffix compounds on Latin acronyms. */
function isHuTechAcronymCompound(token: string): boolean {
  return /^[A-Za-z]{2,6}-(?:s|es|os|e)$/i.test(token);
}

/**
 * Detect Latin "English words" leaking into a translated display title.
 * Tokens listed in `brandWhitelist` (the legitimate brand from
 * splitBrandAndTail) are ignored. Short codes (≤2 letters) and model-like
 * tokens (uppercase + digit, e.g. Q10, B12, R-Form) are also allowed.
 *
 * Whole-word scan (incl. Hungarian diacritics) — avoids false positives on
 * compounds like «stresszoldó» or «energiatakarékos» where ASCII substrings
 * would otherwise match.
 */
export function hasEnglishLeak(text: string, brandWhitelist: string = ""): boolean {
  if (!text) return false;
  const whitelist = new Set<string>(
    brandWhitelist
      .split(/\s+/)
      .map((t) => t.toLowerCase().replace(/[^a-z0-9-]/g, ""))
      .filter(Boolean),
  );
  const tokens =
    text.match(/[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű0-9\-']*/gu) ?? [];
  for (const t of tokens) {
    if (HU_LATIN_LETTERS_RE.test(t)) continue;
    const norm = t.toLowerCase();
    if (norm.length < 4) continue;
    if (whitelist.has(norm)) continue;
    if (HU_ASCII_DESCRIPTOR_ALLOWLIST.has(norm)) continue;
    if (isHuTechAcronymCompound(t)) continue;
    // Model-like: contains a digit (e.g. Q10, B12, R-Form)
    if (/\d/.test(t)) continue;
    return true;
  }
  return false;
}

/** Replace legacy `${b}` catalog template tokens with the product brand/name. */
export function substituteBrandPlaceholder(text: string, brand: string): string {
  if (!text || !text.includes("${b}")) return text;
  const b = brand.trim() || "produkt";
  return text.replace(/\$\{b\}/g, b);
}
