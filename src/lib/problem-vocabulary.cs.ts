/**
 * Problem-first role produktu (CZ) — «Forma + problém», ne SEO eufemismy poličky.
 * Jediný zdroj pro H1 fallback, copy brief a prompt kotvy (jako potency-vocabulary.cs.ts).
 */

import { potencyRoleForForm, POTENCY_ROLE_DEFAULT } from "./potency-vocabulary.cs";
import { getShelfTopic } from "./shelf-topic.cs";
import { HEMORRHOID_SLUG } from "./hemorrhoid-vocabulary.cs";

const TOPICAL_KINDS = new Set([
  "cream", "gel", "balm", "ointment", "spray", "serum", "shampoo", "patch", "cosmetic", "eye_care",
]);

/** Orvosi polcok konkrét vásárlói problémával (nem általános partner bucketek). */
export const SPECIFIC_MEDICAL_SLUGS = new Set([
  "sluch",
  "alkoholismus",
  "odvykani-koureni",
  "hemoroidy",
  "zrak",
  "papilomy",
  "vboceny-palec",
  "vypadavani-vlasu",
  "zvetseni-penisu",
  "hubnuti",
  "prostata",
  "chrapani",
  "potence",
  "cystitida",
  "paraziti",
  "plisen-nehtu",
  "klouby",
  "ledviny",
]);

/** Široké Shakes/partner bucketky, které nesmí přepsat konkrétní slug stránky. */
export const BROAD_PARTNER_BUCKETS = new Set([
  "dychaci-cesty",
  "stres",
  "detox",
  "imunita",
  "jatra",
  "domaci-potreby",
  "other",
  "sluch",
]);

export function isSpecificMedicalSlug(slug: string): boolean {
  return SPECIFIC_MEDICAL_SLUGS.has(slug);
}

export function isBroadPartnerBucket(slug: string): boolean {
  return BROAD_PARTNER_BUCKETS.has(slug);
}

function normalizeForm(formLabel?: string | null, formKind?: string | null): string {
  const label = formLabel?.trim();
  if (label) return label;
  if (formKind === "spray") return "Sprej";
  if (formKind === "gel") return "Gel";
  if (formKind === "cream") return "Krém";
  if (formKind === "drops") return "Kapky";
  if (formKind === "tea") return "Čaj";
  if (formKind === "tablets") return "Tablety";
  if (formKind === "capsules") return "Kapsle";
  return "Produkt";
}

function oralDefault(form: string): string {
  if (form === "Produkt") return "Doplněk stravy";
  return form;
}

/** Kanonická role produktu, když feed infer selže — podle slug stránky + formy. */
export function problemRoleForShelf(
  categorySlug: string,
  formLabel?: string | null,
  formKind?: string | null,
): string | null {
  const form = normalizeForm(formLabel, formKind);
  const oral = oralDefault(form);
  const topical = TOPICAL_KINDS.has(formKind ?? "");

  switch (categorySlug) {
    case "potence":
      return potencyRoleForForm(form === "Produkt" ? null : form) || POTENCY_ROLE_DEFAULT;
    case "sluch":
      return `${oral} pro sluch`;
    case "alkoholismus":
      return `${oral} na podporu při alkoholové závislosti`;
    case "odvykani-koureni":
      return `${oral} na odvykání kouření`;
    case "hemoroidy": {
      const entry = getShelfTopic(HEMORRHOID_SLUG);
      if (entry?.formTemplates) {
        const [role] = entry.formTemplates(form);
        if (role) return role;
      }
      if (topical && /cremă|cream/i.test(form)) return "Krém proti hemoroidům";
      if (topical && /gel/i.test(form)) return "Gel proti hemoroidům";
      return `${oral} proti hemoroidům`;
    }
    case "zrak":
      return `${oral} pro zrak`;
    case "papilomy":
      return `${oral} proti bradavicím`;
    case "vboceny-palec":
      if (formKind === "spray" || /spray/i.test(form)) return "Sprej na Hallux valgus";
      return `${oral} na Hallux valgus`;
    case "vypadavani-vlasu":
      if (formKind === "spray" || /spray/i.test(form) || /\bverdexedil\b/i.test(formLabel ?? ""))
        return "Sprej na vlasy";
      return `${oral} pro péči o vlasy`;
    case "zvetseni-penisu":
      if (topical && /gel/i.test(form)) return "Gel na zvětšení penisu";
      return `${oral} na zvětšení penisu`;
    case "hubnuti":
      if (formKind === "drops" || /picături/i.test(form)) {
        return `${form === "Produkt" ? "Kapky" : form} na kontrolu hmotnosti`;
      }
      return `${oral} na kontrolu hmotnosti`;
    case "prostata":
      return `${oral} pro prostatu`;
    case "chrapani":
      return `${oral} proti chrápání`;
    case "cystitida":
      return `${oral} proti cystitidě`;
    case "paraziti":
      return `${oral} proti parazitům`;
    case "plisen-nehtu":
      if (topical) return `${form} proti plísni nehtů`;
      return `${oral} proti plísni nehtů`;
    case "klouby":
      if (topical) return `${form === "Produkt" ? "Kloubní gel" : form} pro klouby`;
      if (formKind === "unknown" || form === "Produkt") return "Kloubní doplněk stravy";
      return `${oral} pro klouby`;
    case "ledviny":
      return formKind === "tea" || /ceai/i.test(form)
        ? "Čaj na podporu ledvin"
        : `${oral} na podporu ledvin`;
    case "obleceni":
      return "Oblečení";
    case "boty":
      return "Obuv";
    case "zahradni-naradi":
      return "ultrazvukový odpuzovač hlodavců";
    case "traveni":
      return formKind === "tea" || /ceai/i.test(form)
        ? "Čaj pro trávení"
        : `${oral === "Produkt" ? "Doplněk stravy" : oral} pro trávení`;
    case "anti-aging":
      if (topical && (formKind === "serum" || /serum/i.test(form))) return "Anti-aging sérum";
      if (topical && (formKind === "cosmetic" || /cremă|cream|fond|ten|machiaj|bb/i.test(form)))
        return "BB krém";
      if (
        formKind === "capsules" ||
        formKind === "tablets" ||
        formKind === "drops" ||
        formKind === "tea" ||
        /capsul|tablet|picătur|ceai|supliment/i.test(form)
      ) {
        return oral === "Produkt"
          ? "Anti-aging doplněk stravy"
          : `${oral} proti stárnutí`;
      }
      return "Anti-aging doplněk stravy";
    case "kosmeticke-nastroje":
      return "Přístroj na péči o pleť";
    case "osobni-pece":
      return "Osobní hygienický přístroj";
    default:
      return null;
  }
}

/** Měkká kontrola: slovní zásoba role sedí k poličce (ne post-generační QA). */
const SHELF_ROLE_CUES: Partial<Record<string, RegExp>> = {
  sluch: /auz|ohren|sluh|hearing|tinnitus|sluch/i,
  "zrak": /ochi|vedere|vision|lutein|zrak/i,
  hemoroidy: /hemoroid/i,
  alkoholismus: /alcool|alcohol|dezintoxic|alkohol/i,
  papilomy: /papilom|negi|hpv|bradavic/i,
  "vboceny-palec": /valgus|hallux|spray/i,
  "vypadavani-vlasu": /par|spray|capilar|vlas/i,
  "zvetseni-penisu": /penis|marire|marirea|zvětš/i,
  "hubnuti": /greutate|apetit|metabolism|hubnut|hmotnost/i,
  cystitida: /cistit|vezic|urinare|tract urinar/i,
  "ledviny": /rinich|nefro|renal|kidney|ledvin/i,
  "odvykani-koureni": /fumat|nicotin|renuntare|kouřen/i,
  obleceni: /leggings|imbracam|vestiment|oblečen/i,
  boty: /incalt|obuv/i,
  "anti-aging":
    /fond|ten|cosmetic|machiaj|pudr|sprâncen|sprancen|bb|venzen|кушон|supliment|anti-îmbătrânire|anti-aging|riduri|rejuven|îmbătrân|stár/i,
  traveni: /digest|intestinal|gastro|stomac|tract\s*gastro|confort\s*digestiv|tráven/i,
  "stres": /memorie|concentrare|neuropat|stres|anxiet|somn|spomin|cognitive|nerv/i,
  "zahradni-naradi": /repelent|rozătoare|rozatoare|grădin|gradin|ultrasonic|dăunător|daunator|pest|rodent|hlodav/i,
  "kosmeticke-nastroje": /corector|nasal|nazal|îngrijire facială|ingrijire faciala|pleť/i,
};

export function roleMatchesShelf(role: string, categorySlug: string): boolean {
  const re = SHELF_ROLE_CUES[categorySlug];
  if (!re) return true;
  return re.test(role);
}

export function resolveProductPreRole(
  inferRole: (title: string, brand?: string, feed?: string) => string | null,
  input: {
    rawTitle: string;
    brand?: string;
    feedSnippet?: string;
    categorySlug: string;
    formLabel?: string | null;
    formKind?: string | null;
  },
): string | null {
  const fromFeed = inferRole(
    input.rawTitle,
    input.brand,
    input.feedSnippet?.trim() || undefined,
  );
  const fromShelf = problemRoleForShelf(
    input.categorySlug,
    input.formLabel,
    input.formKind,
  );
  if (fromFeed && roleMatchesShelf(fromFeed, input.categorySlug)) return fromFeed;
  return fromShelf ?? fromFeed;
}
