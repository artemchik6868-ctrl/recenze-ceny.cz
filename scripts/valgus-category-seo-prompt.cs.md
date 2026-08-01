# Prompt — `/category/valgus` only (Recenze Ceny CZ)

**Scope:** generate hub copy for `https://recenze-ceny.cz/category/valgus` only.  
Do **not** reuse H2 skeletons from other site categories (joint-care, psoriasis, hair-care…).  
Orient **only** on CZ SERP competitors below and their winning patterns.

---

## Role

You are:

1. **Czech SEO specialist** — commercial category hub for lokální přípravky (krém, sprej) + doplněk stravy při vbočeném palci / hallux valgus.
2. **UX designer** — scannable hub: TOC → layers map → jak vybrat → day/night → etiketa → tables → links → safety callout → FAQ.
3. **Compliance editor** — kosmetika / doplněk stravy ≠ lék; never claim bone correction or cure.

Assortment reality: catalog sells **krém / sprej / kapsle** for comfort support — **not** silicon korektory, noční bandáže, or Hallufix-style dlahy. Mention korektor only as **context layer** (what competitors sell), never as our SKU.

---

## Competitor SERP audit (patterns to steal — do not copy text)

| Competitor type | URLs / examples | Steal | Avoid |
|-----------------|-----------------|-------|-------|
| Orthopedic category | Sanomed, TEJPY | H1 folk + latin: «Vbočený palec (hallux valgus)»; commercial title cluster; product-first clarity | Thin/no editorial, no FAQ |
| Medical guide | Pilulka průvodce | TOC; H2 příčiny → příznaky → léčba → prevence; bullet lists; expert-safe tone; disclaimer | NSAID-heavy; weak on krém/sprej |
| Commercial long-read | Orthexa bez operace | Care layers; realistická očekávání; «kdy k lékaři»; CTA near content | Pushing only their vložky |
| Cream landers | ValGone / Fortolex affiliates | Ingredient + dávkování tables; FAQ; query «krém na vbočený palec» | Overclaims («narovná / vyléčí deformitu») |

**Winning tone:** calm, pharmacy-adjacent Czech; honest about limits of cream vs korektor vs operace.

---

## Keyword cluster

- **primaryKeyword:** `přípravky na vbočený palec`
- **secondary:** hallux valgus, vbočený palec, krém na vbočený palec, krém na hallux valgus, sprej na hallux valgus, lokální péče při hallux valgus, korektor vbočeného palce (info only), noční bandáž (info), široká obuv, ortoped, platba na dobírku, doručení Česká republika
- Put primary KW in intro sentence 1; folk term + latin synonym throughout naturally (no stuffing).

---

## Required page structure (H2 ids)

1. `co-je` — Co je vbočený palec a co katalog řeší  
2. `mapa-pece` — Mapa péče — 4 vrstvy (obuv → korektor → lokální péče → odborník)  
3. `jak-vybrat` — Jak vybrat krém, sprej nebo kapsle  
4. `den-noc` — Den vs noc — režim komfortu  
5. `slozky` — Složky na etiketě  
6. `bezpecnost` — Bezpečnost a kdy k ortopedovi (heading must match `/bezpečnost|kdy k (lékaři\|ortopedovi)/i`)

Intro: 2 paragraphs (~80–120 words total feel). Each H2 body: short prose + bullets where useful.

### Tables (min 2, prefer 3)

1. Vrstvy péče — Co řeší / Co neřeší  
2. Formy v katalogu (krém, sprej, kapsle) — Kdy zvolit / Na co se dívat  
3. Typické složky etikety — Proč se objevují / Na co se dívat  

### hubLinks (≥ 4, paths start with `/`)

- `/pruvodce/valgus`  
- `/delivery`  
- `/medical-expert`  
- related `/category/joint-care` (and optionally another related niche)

### FAQ (7–9)

Topic PAA: krém vs korektor; den/noc aplikace; očekávání; kdy k ortopedovi; délka kúry; kombinace s širokou obuví.  
Do **not** invent COD/shipping FAQ — app merges DEFAULT_PAA.

### Compliance hard bans

- Never: léčí, vyléčí, narovná kost, zaručený výsledek, náhrada operace  
- Always: podpora komfortu / péče o pokožku / doplněk stravy dle etikety  
- Korektor: only while worn; does not permanently fix deformity  

### metaHints (guidance only)

- title ≤ 60 chars, lead with primary intent  
- H1 ≈ primary KW  
- description: benefit + assortment angle + dobírka, 130–158 chars  

---

## Output JSON (maps to SupplementHubPack + seoIntent)

```json
{
  "slug": "valgus",
  "name": "Vbočený palec",
  "serpLedHub": true,
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "…",
  "categorySections": [
    { "id": "co-je", "heading": "…", "body": "…", "bullets": ["…"] }
  ],
  "hubTables": [{ "caption": "…", "headers": ["…"], "rows": [["…"]] }],
  "hubLinks": [{ "label": "…", "path": "/…" }],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "přípravky na vbočený palec",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Přípravky na vbočený palec — od … Kč | Recenze Ceny",
    "h1Example": "Přípravky na vbočený palec",
    "descriptionAngle": "…"
  }
}
```

Write **original Czech**. No competitor brand names in body. No HTML in fields.
