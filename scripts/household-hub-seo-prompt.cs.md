# One-shot prompt — `/category/household` hub SEO (Recenze Ceny)

**Scope:** only slug `household` (`https://recenze-ceny.cz/category/household`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (supplements, home-gadgets, garden-tools, climate). Do **not** polish or extend the current thin niche page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Assortment scope (broad, expanding shelf):** celá kategorie domácí potřeby — úklidové potřeby a pomůcky, organizace a úložné boxy / organizéry, praktické pomůcky do kuchyně a domácnosti, drobní domácí pomocníci (včetně kompaktních řešení na praní menších dávek jako jeden z typů — ne jako jediné jádro H1). **Not** a landing page for 1–2 SKUs. Do **not** mention «aktuálně N produktů». **Not** Bluetooth / USB / LED / standby gadgets (that is `/category/home-gadgets`). **Not** bytový textil jako hlavní příběh (that is `/category/home-textile`).

**Output:** JSON that maps to `CategoryContent` hub fields + `seoIntent` for `household`.

---

## Dual role

1. **Czech SEO specialist** — win commercial-informational intent around `domácí potřeby` / `potřeby pro domácnost` while remaining a **shoppable catalog hub**, not a lifestyle blog encyclopedia.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → types by zone → materiál/životnost → tables → safety → FAQ. Calm practical home tone (cs-CZ). Genre: commercial category hub.

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `domácí potřeby`, `potřeby pro domácnost`, `úklidové potřeby`, `praktické pomůcky do domácnosti`, `organizéry do domácnosti`, `potřeby do domácnosti online`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| E-com categories | dm «Potřeby pro domácnost»; Tescoma «Praktické potřeby»; Fandora; Orion; UNI HOBBY | H1 = KW; short intro 60–120 words; **zone nav** (úklid / kuchyně / úložné / koupelna); product grid | Listing; `X \| Brand` | Shop-first |
| Promo / SEO copy | DrogerieZDE «Domácí potřeby v akci» | Benefit bullets: zásoby, úklid, kuchyně, cena | Thin commercial | Save time/money |
| Organization specialists | Uspořádejto (úložné boxy, organizéry) | Problem → solution; room checklists | Article-like H2 | Practical order |
| Review / comparison hubs | arecenze / SpotřebitelskýTest (mini pračky as one niche) | Typ × kdy zvolit tables; honesty «není náhrada za…» | Commercial comparison | Expert fair |

### Winning patterns to absorb

1. H1 = commercial KW `domácí potřeby`; intro answers «co řešíte doma» for the **whole shelf**.
2. Sections by **home zone / job** (úklid, organizace/úložné, kuchyně, drobní pomocníci) — not brand encyclopedia.
3. Comparison tables: typ × kdy zvolit × na co se dívat; materiál/kvalita or zóna × tip.
4. Checklist «na co se dívat» (rozměry, materiál, obsah balení, záruka, frekvence použití).
5. FAQ 6–8 (výběr podle zóny, úklid vs organizace, materiál, drobní pomocníci vs velké spotřebiče, záruka). COD/delivery PAA may be merged by the app.
6. Clickable internal links only; live product ranking table is built by the app — do not invent SKU rows.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- Medical «kdy k lékaři» / Medical expert links → warranty + safe use of household helpers.
- Generic textile FAQ («Lze prát?») → household FAQs (zones, materials, organizers, compact helpers).
- Missing zone table and material/quality H2.
- Weak primary KW cluster beyond shelf nickname «Pro domácnost».

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping chrome (unless `serpLedHub`), `/pruvodce/household` sibling.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep buying encyclopedia → `/pruvodce/household` (link it; do not duplicate). Electronics gadgets → `/category/home-gadgets`. Textil → `/category/home-textile`.

**Forbidden:** competitor brand names (dm, Orion, Tescoma, IKEA, Spontex, Fandora, …); fake AggregateRating; inventing product SKUs/rows for ItemList; medical claims; «léčí / vyléčí»; `/medical-expert` hubLink; heading containing «kdy k lékaři»; fixing assortment to current live count; making mini pračka the only H1 story.

---

## Keyword cluster

- **primaryKeyword:** `domácí potřeby`
- **secondaryKeywords:** potřeby pro domácnost, úklidové potřeby, praktické pomůcky do domácnosti, organizéry do domácnosti, úložné boxy, potřeby do kuchyně, drobní domácí pomocníci, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; broad assortment types by zone.
2. Sections (ids mandatory):
   - `pro-koho`
   - `jak-vybrat` — checklist bullets
   - `typy-zony` — úklid / organizace-úložné / kuchyně / drobní pomocníci
   - `material-zivotnost` — materiál, frekvence použití, kdy investovat
   - `bezpecnost` — heading **must** match `/bezpečnost|upozornění/i` but **must not** say «kdy k lékaři» (e.g. «Bezpečnost: použití, materiály a záruka»)
3. `hubTables` ≥ 2 (prefer 3):
   - Typ / zóna × kdy zvolit × na co se dívat
   - Materiál / kvalita × kdy investovat × tip
   - Optional: problém doma × typ potřeby × tip
4. `hubLinks` (site-relative only, ≥ 4, **no** medical-expert):
   - `/pruvodce/household`
   - `/delivery`
   - `/returns`
   - `/category/home-gadgets`
   - `/category/home-textile`
5. FAQ 6–8 topic pairs (zone selection, úklid vs organizace, materiál, compact helpers vs full appliances, warranty, returns). Omit pure shipping FAQs if the app merges COD/delivery PAA.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).
10. Set hub flag intent: content will ship with `serpLedHub: true` in TS (skip boilerplate aboutCat chrome).

---

## Output JSON schema

```json
{
  "slug": "household",
  "name": "Domácí potřeby",
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
    { "label": "…", "path": "/pruvodce/household" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "domácí potřeby",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Domácí potřeby — od … Kč | Recenze Ceny",
    "h1Example": "Domácí potřeby",
    "descriptionAngle": "zóny + výběr + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `domácí potřeby`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `typy-zony`, `material-zivotnost`, `bezpecnost`
- [ ] `hubTables.length >= 2`
- [ ] `hubLinks` have no `/medical-expert`
- [ ] No competitor brand names; no medical «kdy k lékaři»
- [ ] Broad assortment language (not «only 1 product» / mini pračka as sole focus)
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
