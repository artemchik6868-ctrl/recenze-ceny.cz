# One-shot prompt — `/category/penis-enlargement` hub SEO (Recenze Ceny)

**Scope:** only this category. Do **not** reuse copy, section templates, or keyword lists from other site hubs. Do **not** rewrite or polish any existing thin page text — invent a fresh hub from CZ SERP competitor patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for slug `penis-enlargement`.

**Catalog reality:** wide commercial shelf that **will keep filling** — gely, krémy, kapsle/doplňky (and education may mention pumpa / extender as related selection context). Write for a full assortment ahead. Never say “jen 2 produkty” or lock copy to current SKU count. Do **not** invent named product brands/SKUs — live grid is dynamic.

**Tone:** široký katalogový hub (ErosStar/Yoo breadth). Commercial how-to + form comparison first. Realistic expectations + safety (no miracle cm / «léčí»), but **not** Proerecta lead narrative «only surgery works».

---

## Dual role

1. **Czech SEO specialist** — beat commercial gel hubs (ErosStar, Yoo, Medpak/Sensu PDP patterns) on usefulness + assortment framing; borrow **table structure** (not tone) from Proerecta methods comparison for srovnání.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → Jak funguje → Jak vybrat → Formy → Srovnání → safety → FAQ. Calm commercial cs-CZ (adult intimate category, discreet).

---

## Competitor SERP brief (patterns to steal — never copy paragraphs or brand names)

Queries: `gel na zvětšení penisu`, `zvětšení penisu`, `krém na zvětšení penisu`, `kapsle na zvětšení penisu`, `přípravky na zvětšení penisu`, `pumpa na zvětšení penisu` (comparison only).

| Pattern | What tops do | How we win |
|---------|--------------|------------|
| H1 / title | Commercial KW first (`Gel na zvětšení penisu`) | `primaryKeyword` = `gel na zvětšení penisu`; H1 aligns; body covers wide shelf |
| Assortment hub | ErosStar: gels + pumps + extenders under one category | Wide form H2 + tables for gel/krém/kapsle + pomůcky as context |
| How it works | Yoo: «Jak fungují gely…», «Co je gel…» — prokrvení, komfort | Dedicated `jak-funguje` H2 (commercial, not myth-busting essay) |
| Ingredient UX | PDP: L-arginin, ženšen, mentol, botanicals | Checklist «na co se dívat na etiketě» |
| Methods table | Proerecta: methods × očekávání × trvalost | Our table: katalogové formy + related methods — original wording, commercial framing |
| Trust / COD | Discrete shipping, dobírka | Intro + FAQ: dobírka, 2–5 dnů, ČR, neutrální balení |
| FAQ / PAA | gel vs krém vs kapsle, očekávání, diskrétní balení | 7–9 real Q&A for FAQPage |

**Forbidden:** competitor brand names (ErosStar, Yoo, Titan Gel, Maxilong, Proerecta, Bathmate, Jes Extender, clinic brands); «zaručeně +X cm / léčí / 100 % trvalé zvětšení tkáně»; fake AggregateRating; inventing named SKUs; locking text to current shelf size.

**Allowed claims style:** «může podpořit prokrvení / komfort / dočasný pocit plnosti dle přípravku»; doplněk stravy nebo intimní kosmetická péče, **nikoli lék ani chirurgický zákrok**. Individual results; read návod.

---

## Keyword cluster

- **primaryKeyword:** `přípravky na zvětšení penisu`
- **secondaryKeywords:** zvětšení penisu, gel na zvětšení penisu, krém na zvětšení penisu, kapsle na zvětšení penisu, prokrvení penisu, pumpa na zvětšení penisu, L-arginin, platba na dobírku, diskrétní balení, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally — no stuffing. H1/title must lead with **wide** primary (`přípravky…`), not gel-only.

---

## Required UX blocks

1. `categoryIntro` — 100–140 words; primary KW in sentence 1; wide assortment framing; dobírka + 2–5 dnů + ČR; doplněk/kosmetika ≠ lék / ≠ operace.
2. Sections (ids mandatory):
   - `pro-koho` — dospělí muži; katalog přípravků; kdy raději lékař
   - `jak-funguje` — gely/krémy/kapsle: prokrvení, komfort, kúra vs příležitostná aplikace
   - `jak-vybrat` — checklist: forma, návod, citlivost, očekávání, diskrétní doprava
   - `formy` — gel / krém / kapsle (+ pumpa/extender jako kontext výběru)
   - `srovnani-metod` — wide comparison (forms × when × expectations)
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Formy katalogu: Gel | Krém | Kapsle × kdy zvolit × na co se dívat
   - Širší srovnání: gel/krém/kapsle/pumpa/extender/operace (krátce) × očekávání × poznámka
4. `hubLinks`:
   - `/pruvodce/penis-enlargement`
   - `/delivery`
   - `/medical-expert`
   - `/category/potence-libido`
5. FAQ 7–9 topic pairs (gel vs krém vs kapsle, očekávání, diskrétní balení, citlivost kůže, kdy k lékaři…) — COD/delivery may be brief or left to merge.
6. `tagline` + `shortDesc` + `keywords` + `seoIntent` + `metaHints`.

---

## Output JSON schema

```json
{
  "slug": "penis-enlargement",
  "name": "Zvětšení penisu",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… (primaryKeyword in sentence 1)",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-funguje", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat …", "body": "…", "bullets": ["…"] },
    { "id": "formy", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "srovnani-metod", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "…",
      "headers": ["Forma", "Kdy zvolit", "Na co se dívat"],
      "rows": [["gel", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Zvětšení penisu", "path": "/pruvodce/penis-enlargement" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Potence a libido", "path": "/category/potence-libido" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "přípravky na zvětšení penisu",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Přípravky na zvětšení penisu — od … Kč | Recenze Ceny",
    "h1Example": "Přípravky na zvětšení penisu",
    "descriptionAngle": "wide assortment + benefit + dobírka CTA"
  }
}
```

Language: Czech (cs-CZ) only in user-facing strings.
