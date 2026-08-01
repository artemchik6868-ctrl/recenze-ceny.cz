# One-shot prompt — `/category/auto` hub SEO (Recenze Ceny)

**Scope:** only slug `auto` (`https://recenze-ceny.cz/category/auto`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (supplements, household, garden-tools, home-gadgets). Do **not** polish or extend the current thin niche page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below. Ignore medical chrome («kdy k lékaři», `/medical-expert`, doplněk stravy) that may appear on the live page today.

**Assortment scope (broad, expanding shelf):** celá kategorie **autodoplňky** / doplňky do auta / autopříslušenství — péče a ochrana (autokosmetika, ochrana laku, clony), komfort interiéru (držáky, organizéry, praktické drobnosti), **autoelektronika** (parkovací senzory, kompresor, nabíjení 12V/USB, sluneční clony s elektronikou), cesty a povinná výbava. Alias `auto-electronics` 301 → `auto`. **Not** a landing page for 1–2 SKUs. Do **not** mention «aktuálně N produktů». Do **not** pretend to be a VIN-filtered carpet mega-catalog (autokoberce / vany do kufru na míru) — mention those types only as selection context if useful, without claiming model-specific inventory.

**Output:** JSON that maps to `CategoryContent` hub fields + `seoIntent` for `auto`.

---

## Dual role

1. **Czech SEO specialist** — win commercial-informational intent around `autodoplňky` while remaining a **shoppable catalog hub**, not a tuning encyclopedia.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose (compatibility) → types by purpose → napájení → tables → safety (montáž/provoz) → FAQ. Calm practical motorista tone (cs-CZ). Genre: commercial category hub.

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `autodoplňky`, `doplňky do auta`, `autopříslušenství`, `jak vybrat autodoplňky`, `autoelektronika`, `kompresor do auta`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| E-com homes | Autodoplňky.cz; Autodoplňky-obchod; AUTIO; EshopAutodoplňky | H1/title KW; category taxonomy (interiér/exteriér/péče/elektronika); trust badges (skladem, doručení); short brand story; product grid | Title stuffed with types; desc with USP; Organization; rarely FAQPage | Shop-first, practical |
| OEM accessories | Škoda Originální příslušenství | Use-case sections (cestování, čistota, kufr) | Product pages | Benefit / official |
| Review / srovnání | Recenzopedia; arecenze; SpotrebitelskyTest | H1 «Nejlepší X 2026»; comparison tables; selection criteria; FAQ | Article-like H2 | Test / expert |
| Buying tips | spoiler-tuning blogs; AUTIO «jak vybrat» sidebars | Compatibility first; quality vs cheap; checklist | Thin article | Advice |

### Winning patterns to absorb

1. H1 = commercial KW `Autodoplňky`; intro answers «co řešíte v autě» for the **whole category**.
2. Sections by **účel** (péče/ochrana · komfort · elektronika · cesty/bezpečnost) — not brand encyclopedia.
3. **Compatibility checklist** (rok/model, 12V/USB, rozměry, montáž) — strongest conversion block in e-com SERP.
4. Comparison tables: typ × kdy zvolit × na co se dívat; napájení (12V zapalovač / USB / akku / bez napájení).
5. FAQ 6–8 (výběr, kompatibilita, instalace, baterie, záruka). COD/delivery PAA may be merged by the app.
6. Clickable internal links only; live product ranking table is built by the app — do not invent SKU rows.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- Medical H2 / medical-expert / «šarže a datum spotřeby» FAQ → practical auto selection + montáž safety.
- Missing purpose taxonomy, napájení table, compatibility checklist H2.
- Weak primary KW density; shelf name «Do auta» must not dominate H1 — use `Autodoplňky`.
- `/medical-expert` hubLink forbidden — use delivery / returns / related non-medical categories.

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping chrome (unless `serpLedHub`), `/pruvodce/auto` sibling.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep buying encyclopedia → `/pruvodce/auto` (link it; do not duplicate).

**Forbidden:** competitor brand names (Škoda OEM shop names as brands, Autodoplňky.cz, AUTIO, Bottari, Osram, Philips, Thule, …); fake AggregateRating; inventing product SKUs/rows for ItemList; medical claims; «léčí / vyléčí»; `/medical-expert` hubLink; heading containing «kdy k lékaři»; fixing assortment to current live count; VIN catalog claims for carpets/trunk mats.

---

## Keyword cluster

- **primaryKeyword:** `autodoplňky`
- **secondaryKeywords:** doplňky do auta, autopříslušenství, autoelektronika, držák mobilu do auta, kompresor do auta, parkovací senzory, ochrana laku, autokosmetika, povinná výbava, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.
- `name` in JSON / hub must be **`Autodoplňky`** (so H1 = commercial KW).

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; broad assortment types (péče, komfort, elektronika, cesty).
2. Sections (ids mandatory):
   - `pro-koho`
   - `jak-vybrat` — compatibility checklist bullets
   - `typy-ucelu` — péče/ochrana · komfort · elektronika · cesty
   - `napajeni` — 12V / USB / akku / bez napájení
   - `bezpecnost` — heading **must** match `/bezpečnost|upozornění/i` but **must not** say «kdy k lékaři» (e.g. «Bezpečnost: montáž, provoz a baterie»)
3. `hubTables` ≥ 2 (prefer 3):
   - Typ doplňku × kdy zvolit × na co se dívat
   - Napájení (12V / USB / akku / bez) × výhody × tip
   - Optional: montáž / kompatibilita × rizika × tip
4. `hubLinks` (site-relative only, ≥ 4, **no** medical-expert):
   - `/pruvodce/auto`
   - `/delivery`
   - `/returns`
   - `/category/home-gadgets`
   - `/category/outdoor-camping`
5. FAQ 6–8 topic pairs (jak vybrat, kompatibilita, instalace, baterie/odběr, záruka, výměna). Include a solid «originalita / dodavatel» answer if needed (NO «šarže / datum spotřeby»). Omit pure shipping FAQs if the app merges COD/delivery PAA.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).
10. Set hub flag intent: content will ship with `serpLedHub: true` in TS (skip boilerplate aboutCat chrome).

---

## Output JSON schema

```json
{
  "slug": "auto",
  "name": "Autodoplňky",
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
    { "label": "…", "path": "/pruvodce/auto" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "autodoplňky",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Autodoplňky — od … Kč | Recenze Ceny",
    "h1Example": "Autodoplňky",
    "descriptionAngle": "výběr + kompatibilita + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `autodoplňky`
- [ ] `name` = `Autodoplňky`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `typy-ucelu`, `napajeni`, `bezpecnost`
- [ ] `hubTables.length >= 2`
- [ ] `hubLinks` have no `/medical-expert`
- [ ] No competitor brand names; no medical «kdy k lékaři»; no «šarže / datum spotřeby»
- [ ] Broad assortment language (not «only 1 product»)
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
