/** CPA TL / partner nutra-lane archetípusok — lágy LLM útmutatás, nem SKU felülírások. */

export type NutraLaneArchetype = {
  feedTitle: string;
  partnerBucket: string;
  feedCue: string;
  goodShelf: string;
  goodRoleCs: string;
  badShelf: string;
  badRoleCs: string;
  /** Oldal slugok, ahol ez az archetípus a legrelevánsabb. */
  pageSlugs?: string[];
  /** Regex a feed haystack ellen dinamikus boostpro. */
  feedCueRe?: RegExp;
};

export const NUTRA_LANE_ARCHETYPES: NutraLaneArchetype[] = [
  {
    feedTitle: "Uromexil — kapsle (leírás: férfi potencia)",
    partnerBucket: "Nutra: magas vérnyomás",
    feedCue: "potencia / erekció / libidó",
    goodShelf: "potence",
    goodRoleCs: "kapsle na potenci",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás doplněk stravy",
    pageSlugs: ["krevni-tlak", "potence"],
    feedCueRe: /potenc|poten[țt]|libido|erec|erect|потенц|эрекц/i,
  },
  {
    feedTitle: "CardioBalance — kapsle (bucket: Nutra: potencia)",
    partnerBucket: "Nutra: potencia",
    feedCue: "vérnyomás / szív- és érrendszer",
    goodShelf: "krevni-tlak",
    goodRoleCs: "vérnyomás kapsle",
    badShelf: "potence",
    badRoleCs: "kapsle na potenci",
    pageSlugs: ["potence", "krevni-tlak"],
    feedCueRe: /tensiune|hypertens|cardio|blood\s*pressure|гипертон|давлен/i,
  },
  {
    feedTitle: "ProstaMax — kapsle (bucket: Nutra: magas vérnyomás)",
    partnerBucket: "Nutra: magas vérnyomás",
    feedCue: "prosztata / gyakori vizelés",
    goodShelf: "prostata",
    goodRoleCs: "kapsle na prostatu",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás doplněk stravy",
    pageSlugs: ["krevni-tlak", "prostata"],
    feedCueRe: /prostat|mictiun|urin|простат/i,
  },
  {
    feedTitle: "ArtroFlex — kapsle (bucket: Nutra: magas vérnyomás)",
    partnerBucket: "Nutra: magas vérnyomás",
    feedCue: "ízületek / térdek / mozgékonyság",
    goodShelf: "klouby",
    goodRoleCs: "kloubní kapsle",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás doplněk stravy",
    pageSlugs: ["krevni-tlak", "klouby"],
    feedCueRe: /articulat|genunchi|joint|sklep|сустав/i,
  },
  {
    feedTitle: "Detoxil — kapsle (bucket: Nutra: cukorbetegség)",
    partnerBucket: "Nutra: cukorbetegség",
    feedCue: "paraziták / bélféreg proti",
    goodShelf: "paraziti",
    goodRoleCs: "proti parazitům kapsle",
    badShelf: "cukrovka",
    badRoleCs: "vércukor doplněk stravy",
    pageSlugs: ["cukrovka", "paraziti"],
    feedCueRe: /parazit|anthelmint|vermifug|глист/i,
  },
  {
    feedTitle: "SlimFit — kapsle (bucket: Nutra: magas vérnyomás)",
    partnerBucket: "Nutra: magas vérnyomás",
    feedCue: "fogyás / étvágy / anyagcsere",
    goodShelf: "hubnuti",
    goodRoleCs: "kapsle na kontrolu hmotnosti",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás doplněk stravy",
    pageSlugs: ["krevni-tlak", "hubnuti"],
    feedCueRe: /slăbire|greutate|apetit|weight\s*loss|odchud|похуд/i,
  },
  {
    feedTitle: "Pulsero — kapsle (csak márka, leírás: potencia)",
    partnerBucket: "Nutra: magas vérnyomás",
    feedCue: "potencia / libidó a leírásból",
    goodShelf: "potence",
    goodRoleCs: "kapsle na potenci",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás doplněk stravy",
    pageSlugs: ["krevni-tlak"],
    feedCueRe: /potenc|poten[țt]|libido|erec/i,
  },
  {
    feedTitle: "Hyperpotency — kapsle (bucket: Nutra: magas vérnyomás)",
    partnerBucket: "Nutra: magas vérnyomás",
    feedCue: "hyperpotency / potencia",
    goodShelf: "potence",
    goodRoleCs: "potencia és libidó kapsle",
    badShelf: "krevni-tlak",
    badRoleCs: "vérnyomás doplněk stravy",
    pageSlugs: ["krevni-tlak", "potence"],
    feedCueRe: /hyperpotenc|potenc|poten[țt]/i,
  },
];

function scoreArchetype(a: NutraLaneArchetype, pageSlug: string, haystack: string): number {
  let score = 0;
  if (a.pageSlugs?.includes(pageSlug)) score += 3;
  if (a.badShelf === pageSlug || a.goodShelf === pageSlug) score += 2;
  if (a.feedCueRe?.test(haystack)) score += 4;
  return score;
}

/** 3–5 archetípus kiválasztása az oldal slug és feed szöveg alapján. */
export function pickNutraLaneArchetypes(
  pageSlug: string,
  feedHaystack = "",
  limit = 5,
): NutraLaneArchetype[] {
  const hay = feedHaystack.trim();
  const ranked = NUTRA_LANE_ARCHETYPES.map((a) => ({
    a,
    score: scoreArchetype(a, pageSlug, hay),
  }))
    .filter(({ score }) => score > 0)
    .sort((x, y) => y.score - x.score);

  if (ranked.length >= 3) return ranked.slice(0, limit).map(({ a }) => a);

  const fallback = NUTRA_LANE_ARCHETYPES.filter(
    (a) => a.pageSlugs?.includes(pageSlug) || a.badShelf === pageSlug || a.goodShelf === pageSlug,
  );
  const seen = new Set<string>();
  const out: NutraLaneArchetype[] = [];
  for (const a of [...ranked.map(({ a }) => a), ...fallback, ...NUTRA_LANE_ARCHETYPES]) {
    const key = `${a.goodShelf}:${a.badShelf}:${a.feedTitle}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

export function formatNutraLaneArchetypeLine(a: NutraLaneArchetype): string {
  return (
    `- «${a.feedTitle}» (bucket: «${a.partnerBucket}», cue: ${a.feedCue})\n` +
    `    DOBŘE: «${a.goodShelf}» («${a.goodRoleCs}»)\n` +
    `    ŠPATNĚ: «${a.badShelf}» («${a.badRoleCs}»)`
  );
}

export function buildNutraLaneArchetypesBlock(
  pageSlug: string,
  feedHaystack = "",
  limit = 5,
): string {
  const picks = pickNutraLaneArchetypes(pageSlug, feedHaystack, limit);
  if (picks.length === 0) return "";
  return picks.map(formatNutraLaneArchetypeLine).join("\n");
}
