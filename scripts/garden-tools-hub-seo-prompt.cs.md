# One-shot prompt — `/category/garden-tools` hub SEO (Recenze Ceny)

**Scope:** only slug `garden-tools` (`https://recenze-ceny.cz/category/garden-tools`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (supplements, home-gadgets, climate). Do **not** polish or extend the current thin niche page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Assortment scope (broad, expanding shelf):** celá kategorie zahradní nářadí — ruční základ (rýč, lopata, hrábě, motyka/motyčka, vidle, sekera, drobné ruční nářadí), střih/řezání (zahradní nůžky, nůžky na větve, plotostřih, pilka / mini pila), péče o trávník a okraje (strunová sekačka, hrábě na listí, fukar), napájení (ruční / aku / elektro / benzín). **Not** a landing page for 1–2 SKUs. Do **not** mention «aktuálně N produktů». Not garden lamps / solar IP FAQ as the main story. Not agro fertilizers (that is `/category/garden-agro`).

**Output:** JSON that maps to `CategoryContent` hub fields + `seoIntent` for `garden-tools`.

---

## Dual role

1. **Czech SEO specialist** — win commercial-informational intent around `zahradní nářadí` while remaining a **shoppable catalog hub**, not a brand encyclopedia.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → types by work → základní sada / velikost zahrady → napájení → tables → safety → FAQ. Calm practical garden tone (cs-CZ). Genre: commercial category hub.

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `zahradní nářadí`, `ruční zahradní nářadí`, `jak vybrat zahradní nářadí`, `zahradní nářadí srovnání`, `aku zahradní nářadí`, `základní sada zahradního nářadí`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| E-com categories | Kamír; Parkside DIY; Ryobi CZ; AROK; Ohromně | H1 = KW; thin intro; subcats (ruční / nůžky / technika); product grid first | Listing; `X \| Brand` | Shop-first |
| Buying guides | AZ-Zahrada «základní sada»; Decorise «jak vybrat»; zahradnizbozi | H1 benefit; 5-tool starter kit; materials; size-of-garden; FAQ accordion; internal links | Article-like; clear H2 | Expert practical |
| Comparison / review hubs | Recenzopedia TOP table; arecenze / TestMagazin (plotostřihy, aku nůžky) | Ranking table; criteria; aku vs elektro vs benzín; klady/zápory | Commercial comparison titles | Review / test |

### Winning patterns to absorb

1. H1 = commercial KW `zahradní nářadí`; intro answers «co pořídit jako první» for the **whole category**.
2. Sections by **typ práce / velikost zahrady / napájení** — broad type overview, not brand encyclopedia.
3. Comparison tables: typ práce × kdy zvolit × na co se dívat; napájení (ruční / aku / elektro / benzín); optional materiál/kvalita.
4. Checklist «na co se dívat» + **základní sada** (rýč, lopata, hrábě, motyčka + střih / okraje podle potřeby).
5. FAQ 6–8 (výběr podle práce, kvalita vs cena, napájení, bezpečnost při řezání, záruka). COD/delivery PAA may be merged by the app.
6. Clickable internal links only; live product ranking table is built by the app — do not invent SKU rows.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- Lampy/IP / medical-style FAQ → practical garden selection + tool safety.
- Missing work-type table, napájení table, základní sada H2.
- Weak primary KW density in H2.
- `/medical-expert` hubLink inappropriate — use delivery / returns / related garden categories.

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping chrome (unless `serpLedHub`), `/pruvodce/garden-tools` sibling.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep buying encyclopedia → `/pruvodce/garden-tools` (link it; do not duplicate).

**Forbidden:** competitor brand names (Fiskars, Gardena, Makita, Parkside, Ryobi, DeWit, Bosch, Fieldmann, …); fake AggregateRating; inventing product SKUs/rows for ItemList; medical claims; «léčí / vyléčí»; `/medical-expert` hubLink; heading containing «kdy k lékaři»; fixing assortment to current live count.

---

## Keyword cluster

- **primaryKeyword:** `zahradní nářadí`
- **secondaryKeywords:** ruční zahradní nářadí, aku zahradní nářadí, zahradní technika, zahradní nůžky, plotostřih, strunová sekačka, hrábě, rýč, motyka, základní sada zahradního nářadí, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; broad assortment types.
2. Sections (ids mandatory):
   - `pro-koho`
   - `jak-vybrat` — checklist bullets
   - `typy-prace` — ruční / střih / trávník-okraje
   - `zakladni-sada` — starter kit + velikost zahrady
   - `napajeni` — ruční vs aku vs elektro vs benzín
   - `bezpecnost` — heading **must** match `/bezpečnost|upozornění/i` but **must not** say «kdy k lékaři» (e.g. «Bezpečnost: řezání, napájení a ochranné pomůcky»)
3. `hubTables` ≥ 2 (prefer 3):
   - Typ práce / nářadí × kdy zvolit × na co se dívat
   - Napájení (ruční / aku / elektro / benzín) × výhody × tip
   - Optional: materiál / kvalita × kdy investovat × tip
4. `hubLinks` (site-relative only, ≥ 4, **no** medical-expert):
   - `/pruvodce/garden-tools`
   - `/delivery`
   - `/returns`
   - `/category/garden-agro`
   - `/category/outdoor-camping`
5. FAQ 6–8 topic pairs (starter kit, quality vs price, aku vs elektro, střih tools, safety, warranty). Omit pure shipping FAQs if the app merges COD/delivery PAA.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).
10. Set hub flag intent: content will ship with `serpLedHub: true` in TS (skip boilerplate aboutCat chrome).

---

## Output JSON schema

```json
{
  "slug": "garden-tools",
  "name": "Zahradní nářadí",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "…",
  "categorySections": [
    {
      "id": "pro-koho",
      "heading": "…",
      "body": "…",
      "bullets": ["…"]
    }
  ],
  "hubTables": [
    {
      "caption": "…",
      "headers": ["…", "…", "…"],
      "rows": [["…", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "…", "path": "/pruvodce/garden-tools" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "zahradní nářadí",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Zahradní nářadí — od … Kč | Recenze Ceny",
    "h1Example": "Zahradní nářadí",
    "descriptionAngle": "výběr + typy + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `zahradní nářadí`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `typy-prace`, `zakladni-sada`, `napajeni`, `bezpecnost`
- [ ] `hubTables.length >= 2`
- [ ] `hubLinks` have no `/medical-expert`
- [ ] No competitor brand names; no medical «kdy k lékaři»; no lampy/IP-led FAQ
- [ ] Broad assortment language (not «only 2 products»)
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
