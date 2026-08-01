# One-shot prompt — `/category/home-gadgets` hub SEO (Recenze Ceny)

**Scope:** only slug `home-gadgets` (`https://recenze-ceny.cz/category/home-gadgets`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (supplements, climate, household). Do **not** polish or extend the current thin niche page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Assortment scope (broad shelf):** Bluetooth audio, USB doplňky, LED / laserové světlo a projektory, mini čerpadla, kompaktní USB pomocníci, zařízení na úsporu energie / chytré vypínání standby — not kitchen lifehacks with vinegar, not full smart-home HVAC.

**Output:** JSON that maps to `CategoryContent` hub fields + `seoIntent` for `home-gadgets`.

---

## Dual role

1. **Czech SEO specialist** — win commercial-informational intent around `užitečné vychytávky do domácnosti` / `domácí vychytávky` while remaining a **shoppable gadget catalog**, not a lifestyle blog encyclopedia.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → types → energy/standby → tables → safety/warranty → FAQ. Practical, calm tech-home tone (cs-CZ). Genre: commercial category hub.

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `domácí vychytávky`, `užitečné vychytávky do domácnosti`, `chytré vychytávky do domácnosti`, `praktické pomůcky do domácnosti`, `USB vychytávky do domácnosti`, Bluetooth reproduktor výběr.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| Lifehack articles | offpitch «Užitečné vychytávky…»; azeny; Dotyk | Benefit H1; many H2/H3 by zone (standby, úklid, koupelna); bullets; «mini nákupní seznam»; shrnutí + zdroje | Article; long colon titles; weak e-com schema | Practical, save time/money |
| Smart-home guides | e-beko; Srovnejto; CNN Prima | Device types (zásuvky, LED, termostaty); savings table; how to choose / compatibility | Article + tables | Comfort + energy |
| E-com categories | Orion «Pomocníci»; vybaveniprouklid «Vychytávky» | H1 = category; filters; product grid; thin intro | Listing; `X \| Brand` | Shop-first |
| Buying guides | COMFOR / digirevue (Bluetooth) | Parameter checklist; tech comparison | Article | Expert how-to |

### Winning patterns to absorb

1. Benefit-first framing: šetří čas, peníze, energii — not «zázraky z reklamy».
2. Thematic sections by **solution type** (audio, USB, světlo, úspora energie, kompaktní pomocníci) — not vinegar lifehacks.
3. Checklist bullets «na co se dívat» (napájení, rozměry, IP/bezpečnost laseru, záruka, obsah balení).
4. Comparison tables (typ × kdy zvolit; napájení/připojení).
5. Standby / phantom load education (EU limits context) tied to **gadgets you can buy** (zásuvky s vypínačem, energy helpers) — cite idea, do not copy competitor text.
6. Mini shopping logic: when Bluetooth vs USB light vs energy helper.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- 1-sentence niche intro → useful multi-paragraph hub (~800–1200 words body total).
- Wrong medical «kdy k lékaři» / Medical expert links → warranty + electrical/laser safety.
- Generic textile FAQ («Lze prát?») → gadget FAQs (Bluetooth, USB, laser, záruka).
- Missing type table and energy/standby H2.
- Weak primary KW cluster beyond shelf nickname.

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping block, `/pruvodce/home-gadgets` sibling.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep buying encyclopedia → `/pruvodce/home-gadgets` (link it; do not duplicate).

**Forbidden:** competitor brand names (Orion, Philips Hue, Nest, Tado, JBL, Bose, Solight, …); fake AggregateRating; inventing product SKUs/rows for ItemList; medical claims; «léčí / vyléčí»; `/medical-expert` hubLink; heading containing «kdy k lékaři».

---

## Keyword cluster

- **primaryKeyword:** `užitečné vychytávky do domácnosti`
- **secondaryKeywords:** domácí vychytávky, chytré vychytávky do domácnosti, praktické pomůcky do domácnosti, USB doplňky do domácnosti, Bluetooth reproduktor, LED pásek, laserový projektor, mini čerpadlo, zařízení na úsporu energie, chytrá zásuvka, standby spotřeba, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; broad assortment types.
2. Sections (ids mandatory):
   - `pro-koho`
   - `jak-vybrat` — checklist bullets
   - `typy-vychytavek` — audio/Bluetooth, USB & napájení, světlo/LED/laser, úspora energie, kompaktní pomocníci (mini čerpadla atd.)
   - `uspora-energie` — standby / vypínání; practical gadget angle
   - `bezpecnost` — heading **must** match `/bezpečnost|upozornění/i` but **must not** say «kdy k lékaři» (e.g. «Bezpečnost: napájení, materiály a záruka»)
3. `hubTables` ≥ 2:
   - Typ × kdy zvolit × na co se dívat
   - Napájení / připojení (USB / Bluetooth / síť / baterie)
4. `hubLinks` (site-relative only, ≥ 4, **no** medical-expert):
   - `/pruvodce/home-gadgets`
   - `/delivery`
   - `/returns`
   - `/category/home-climate`
   - `/category/household`
5. FAQ 6–8 topic pairs (typ výběru, Bluetooth dosah, USB výkon, laser/děti, záruka, kompatibilita). COD/delivery PAA are merged by the app — omit pure shipping FAQs.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "home-gadgets",
  "name": "Domácí vychytávky",
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
    { "label": "…", "path": "/pruvodce/home-gadgets" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "užitečné vychytávky do domácnosti",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Užitečné vychytávky do domácnosti — od … Kč | Recenze Ceny",
    "h1Example": "Užitečné vychytávky do domácnosti",
    "descriptionAngle": "benefit + types + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `užitečné vychytávky do domácnosti`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `typy-vychytavek`, `uspora-energie`, `bezpecnost`
- [ ] `hubTables.length >= 2`
- [ ] `hubLinks` have no `/medical-expert`
- [ ] No competitor brand names; no medical «kdy k lékaři»
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
