/** Static Cyrillic (RU/UK) → German tail mappings for DE storefront H1 pipeline. */

export const CYRILLIC_TEXT_RE = /[\u0400-\u04FF]/;

/** Cyrillic word suffix — \w does not match Cyrillic letters in JS. */
const CYR = "[\\p{L}\\p{N}_]*";

export const CYR_TAIL_DE: ReadonlyArray<readonly [RegExp, string]> = [
  [new RegExp(`гель\\s+для\\s+(?:суглоб|сустав)${CYR}`, "giu"), "Gelenkgel"],
  [new RegExp(`gel\\s+za\\s+sklepe`, "giu"), "Gelenkgel"],
  [new RegExp(`(?:spray|спрей).*(?:valgus|hallux|вальгус|косточк|кісточк)`, "giu"), "Spray bei Hallux valgus"],
  [new RegExp(`(?:valgus|hallux|вальгус).*(?:spray|спрей)`, "giu"), "Spray bei Hallux valgus"],
  [new RegExp(`(?:від|от|для|za).*(?:вальгус|valgus|hallux|косточк|кісточк)`, "giu"), "bei Hallux valgus"],
  [new RegExp(`(?:слух|ух[оа]|hearing|tinnit)`, "giu"), "für das Gehör"],
  [new RegExp(`(?:потенц|erekt|potenc)`, "giu"), "für die Potenz"],
  [new RegExp(`мармелад(?:\\s+для\\s+похуд${CYR})?`, "giu"), "Gummibärchen zur Gewichtsregulierung"],
  [new RegExp(`жевательн(?:ые|ая)\\s+конфет${CYR}`, "giu"), "Kaubonbons"],
  [new RegExp(`(?:від|от)\\s+простатит${CYR}`, "giu"), "für die Prostata"],
  [new RegExp(`(?:від|от)\\s+цистит${CYR}`, "giu"), "bei Blasenentzündung"],
  [new RegExp(`(?:для|від|от)\\s+(?:суглоб|сустав)${CYR}`, "giu"), "für die Gelenke"],
  [new RegExp(`(?:для|від)\\s+(?:волос(?:ся)?|волос)${CYR}`, "giu"), "für die Haare"],
  [new RegExp(`(?:для|від)\\s+(?:зор[уа]|глаз|зрен)${CYR}`, "giu"), "für die Augen"],
  [new RegExp(`(?:для|від|от)\\s+(?:схудн|похуд|в(?:ага|ес))${CYR}`, "giu"), "zur Gewichtsregulierung"],
  [new RegExp(`(?:від|от)\\s+(?:гриб(?:к|ков)|микоз)${CYR}`, "giu"), "gegen Pilz"],
  [new RegExp(`(?:від|от)\\s+гемор(?:оя|ою)${CYR}`, "giu"), "bei Hämorrhoiden"],
  [new RegExp(`(?:від|от)\\s+варикоз${CYR}`, "giu"), "bei Krampfadern"],
  [new RegExp(`(?:від|от)\\s+алкогол${CYR}`, "giu"), "Unterstützung bei Alkoholabhängigkeit"],
  [new RegExp(`(?:від|от)\\s+куре(?:ния|ння)${CYR}`, "giu"), "zum Rauchverzicht"],
  [new RegExp(`(?:капсул|capsule)${CYR}`, "giu"), "Kapseln"],
  [new RegExp(`(?:крем|маз(?:ь|і))${CYR}`, "giu"), "Creme"],
  [new RegExp(`(?<![\\p{L}\\p{N}])(?:гел(?:ь|ю)|gel)(?![\\p{L}\\p{N}])`, "giu"), "Gel"],
  [new RegExp(`(?:спрей|spray)${CYR}`, "giu"), "Spray"],
  [new RegExp(`(?:капл(?:и|і|ей))${CYR}`, "giu"), "Tropfen"],
  [new RegExp(`(?:сироп)${CYR}`, "giu"), "Sirup"],
  [new RegExp(`(?:масаж(?:ер|ер)|massager)${CYR}`, "giu"), "Massagegerät"],
  [new RegExp(`(?:для\\s+чоловік|для\\s+мужчин)${CYR}`, "giu"), "für Männer"],
  [new RegExp(`(?:для\\s+жінок|для\\s+женщин)${CYR}`, "giu"), "für Frauen"],
  [new RegExp(`(?:средств${CYR}|засіб${CYR})`, "giu"), "Mittel"],
  [new RegExp(`(?:увеличен${CYR}\\s+член${CYR}|пenis)`, "giu"), "Penisvergrößerung"],
  [new RegExp(`(?:гель\\s+для\\s+увеличен${CYR})`, "giu"), "Vergrößerungsgel"],
];

/** Apply static Cyrillic→DE phrase replacements (may leave partial Cyrillic). */
export function applyStaticCyrillicTailDe(tail: string): string {
  let s = tail.trim();
  if (!s || !CYRILLIC_TEXT_RE.test(s)) return s;
  for (const [re, repl] of CYR_TAIL_DE) s = s.replace(re, repl);
  return s.replace(/\s{2,}/g, " ").replace(/^[\s\-—–]+|[\s\-—–]+$/g, "").trim();
}

/** Fully resolve tail to German, or null if Cyrillic remains after static map. */
export function cyrillicTailToDe(tail: string): string | null {
  const s = applyStaticCyrillicTailDe(tail);
  if (!s || CYRILLIC_TEXT_RE.test(s)) return null;
  return s;
}
