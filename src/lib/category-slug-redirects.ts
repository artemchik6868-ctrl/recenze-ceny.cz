/**
 * Legacy / English category slug → canonical Czech SEO slug
 * (301 on category hubs, PDP category segment, and /pruvodce).
 *
 * Canonical slugs are Czech keywords without diacritics.
 */
export const CATEGORY_SLUG_REDIRECTS: Record<string, string> = {
  // Previous legacy aliases
  "auto-electronics": "autodoplnky",
  "mens-vitality": "potence",
  "potenz-libido": "potence",
  "intimate-comfort": "hemoroidy",

  // English shelf → Czech SEO
  "joint-care": "klouby",
  "weight-management": "hubnuti",
  "varicose-veins": "krecove-zily",
  "blood-pressure": "krevni-tlak",
  "diabetes-care": "cukrovka",
  hemorrhoids: "hemoroidy",
  "potence-libido": "potence",
  "prostate-health": "prostata",
  "vision-eye-care": "zrak",
  fungus: "plisen-nehtu",
  digestive: "traveni",
  parasites: "paraziti",
  cystitis: "cystitida",
  "sleep-snoring": "chrapani",
  "smoking-cessation": "odvykani-koureni",
  "hair-care": "vypadavani-vlasu",
  "nervous-system": "stres",
  immunity: "imunita",
  "liver-health": "jatra",
  "kidney-health": "ledviny",
  "respiratory-health": "dychaci-cesty",
  "detox-cleanse": "detox",
  "womens-health": "zdravi-zen",
  hearing: "sluch",
  alcoholism: "alkoholismus",
  psoriasis: "lupenka",
  valgus: "vboceny-palec",
  papillomas: "papilomy",
  "penis-enlargement": "zvetseni-penisu",
  "breast-enlargement": "zvetseni-prsou",
  "medical-devices": "lekarske-pristroje",
  massagers: "masazni-pristroje",
  "beauty-tools": "kosmeticke-nastroje",
  "personal-grooming": "osobni-pece",
  "home-climate": "domaci-klima",
  "home-textile": "domaci-textil",
  "home-gadgets": "domaci-vychytavky",
  household: "domaci-potreby",
  "garden-agro": "zahrada",
  "garden-tools": "zahradni-naradi",
  "outdoor-camping": "outdoor-kempovani",
  "kids-toys": "hracky",
  "heated-apparel": "vyhrivane-obleceni",
  clothing: "obleceni",
  shoes: "boty",
  accessories: "modni-doplnky",
  auto: "autodoplnky",
  optics: "optika",
  // anti-aging stays unchanged
};

/** Resolve one hop of legacy → canonical (null if already canonical). */
export function categorySlugRedirectTarget(slug: string): string | null {
  return CATEGORY_SLUG_REDIRECTS[slug] ?? null;
}

/** Normalize any known legacy/EN shelf slug to the canonical Czech slug. */
export function normalizeCategoryShelfSlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  const s = slug.trim().toLowerCase();
  return CATEGORY_SLUG_REDIRECTS[s] ?? s;
}
