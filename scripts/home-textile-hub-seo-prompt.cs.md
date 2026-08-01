# One-shot prompt — `/category/home-textile` hub SEO (Recenze Ceny)

**Scope:** only slug `home-textile` (`https://recenze-ceny.cz/category/home-textile`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (household, home-gadgets, supplements, climate). Do **not** polish or extend the current thin niche page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Assortment scope:** deky, přehozy, přikrývky, povlečení / ložní prádlo, polštáře, případně prostěradla a chrániče matrací. **Not** a landing for 1–2 SKUs. Do **not** mention «aktuálně N produktů». **Not** záclony / závěsy / metráž / šití na míru as the H1 story (competitor specialty we do not own). **Not** elektrické deky / topení (that is `/category/home-climate`). **Not** úklidové potřeby / organizéry (that is `/category/household`).

**Output:** JSON that maps to `CategoryContent` hub fields + `seoIntent` for `home-textile`.

---

## Dual role

1. **Czech SEO specialist** — win commercial-informational intent around `bytový textil` while remaining a **shoppable catalog hub**, not a lifestyle blog encyclopedia.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → types (deka / přehoz / přikrývka / povlečení / polštář) → materiál / gramáž → tables → care & safety → FAQ. Calm practical home tone (cs-CZ). Genre: commercial category hub.

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `bytový textil`, `domácí textil obchod`, `povlečení online koupit`, `ložní prádlo recenze srovnání`, `deka přikrývka jak vybrat materiál`, `deka přehoz koupit online`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| E-com category hubs | byttextil.cz; BYTEMA; Goldea; Biante; JIMI Textil; TextilCentrum; Tibex | H1 = KW; intro 80–150 words; **type nav** (povlečení / prostěradla / polštáře-přikrývky / deky-přehozy); product grid | Listing; `KW \| Brand` / «velký výběr skladem» | Shop-first, útulný domov |
| Review / comparison | arecenze povlečení; rankito ložní povlečení | Comparison tables (klady/zápory, cena, typ); H2 materiály (bavlna/krep/satén/len/flanel/mikroplyš) | Commercial comparison | Expert fair («pro nenáročné», «nevhodné na léto») |
| Buying guides | JYSK průvodce přikrývkami; periny.com; luxusní deky; Mikaton magazín | Checklist: výplň, **gramáž / TOG**, rozměry, alergie, péče; material × hřejivost tables | Guide / how-to | Practical sleep comfort |
| Material education | pandasilk materials chart; editorial satén vs bavlna vs len | Dense material comparison tables | Article | Educational commercial |

### Winning patterns to absorb

1. H1 = commercial KW `bytový textil`; intro answers «co řešíte v ložnici / na gauči» for the **whole shelf**.
2. Sections by **product type / job** (deka vs přehoz vs přikrývka vs povlečení vs polštář) — not brand encyclopedia, not curtains/custom sewing.
3. Comparison tables: typ × kdy zvolit × na co se dívat; materiál × hřejivost / prodyšnost / údržba; problém (nocní pot / zima / gauč) × řešení.
4. Checklist «na co se dívat» (rozměry lůžka, materiál/výplň, gramáž, alergie, praní, zapínání).
5. FAQ 6–8 (deka vs přehoz, gramáž, alergie, praní, rozměry, záruka). COD/delivery PAA may be merged by the app.
6. Clickable internal links only; live product ranking table is built by the app — do not invent SKU rows.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- Medical «kdy k lékaři» / Medical expert links → care, allergies, washing, warranty.
- Missing material/gramáž tables and typ × kdy zvolit.
- Weak differentiation deka / přehoz / přikrývka / povlečení.
- Weak primary KW cluster beyond shelf nickname «Domácí textil».

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping chrome (unless `serpLedHub`), `/pruvodce/home-textile` sibling.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep buying encyclopedia → `/pruvodce/home-textile` (link it; do not duplicate). Elektrické deky / klima → `/category/home-climate`. Domácí potřeby → `/category/household`.

**Forbidden:** competitor brand names (byttextil, BYTEMA, Goldea, Biante, JIMI, SCANquilt, Matějovský, JYSK, IKEA, …); fake AggregateRating; inventing product SKUs/rows for ItemList; medical claims; «léčí / vyléčí»; `/medical-expert` hubLink; heading containing «kdy k lékaři»; fixing assortment to current live count; making záclony/metráž or elektrická deka the only H1 story.

---

## Keyword cluster

- **primaryKeyword:** `bytový textil`
- **secondaryKeywords:** domácí textil, povlečení, ložní prádlo, deka, přehoz, přikrývka, polštář, prostěradlo, mikroplyšová deka, bavlněné povlečení, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; broad assortment types (deka, přehoz, přikrývka, povlečení, polštář).
2. Sections (ids mandatory):
   - `pro-koho`
   - `jak-vybrat` — checklist bullets
   - `typy-textilu` — deka / přehoz / přikrývka / povlečení / polštář
   - `material-gramaz` — materiál, výplň, gramáž, kdy investovat
   - `bezpecnost` — heading **must** match `/bezpečnost|upozornění/i` but **must not** say «kdy k lékaři» (e.g. «Bezpečnost: praní, alergie a záruka»)
3. `hubTables` ≥ 2 (prefer 3):
   - Typ × kdy zvolit × na co se dívat
   - Materiál × hřejivost / prodyšnost / údržba (or kdy investovat × tip)
   - Optional: problém (nocní pot / zima / gauč) × typ textilu × tip
4. `hubLinks` (site-relative only, ≥ 4, **no** medical-expert):
   - `/pruvodce/home-textile`
   - `/delivery`
   - `/returns`
   - `/category/household`
   - `/category/home-climate`
5. FAQ 6–8 topic pairs (deka vs přehoz, gramáž, alergie, praní, rozměry, záruka, returns). Omit pure shipping FAQs if the app merges COD/delivery PAA.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).
10. Set hub flag intent: content will ship with `serpLedHub: true` in TS (skip boilerplate aboutCat chrome).

---

## Output JSON schema

```json
{
  "slug": "home-textile",
  "name": "Domácí textil",
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
    { "label": "…", "path": "/pruvodce/home-textile" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "bytový textil",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Bytový textil — od … Kč | Recenze Ceny",
    "h1Example": "Bytový textil",
    "descriptionAngle": "typy + materiál + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `bytový textil`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `typy-textilu`, `material-gramaz`, `bezpecnost`
- [ ] `hubTables.length >= 2`
- [ ] `hubLinks` have no `/medical-expert`
- [ ] No competitor brand names; no medical «kdy k lékaři»
- [ ] Broad assortment language (not «only 1 product» / curtains or electric blanket as sole focus)
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
