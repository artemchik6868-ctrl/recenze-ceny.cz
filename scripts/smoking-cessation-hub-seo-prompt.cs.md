# One-shot prompt — `/category/smoking-cessation` hub SEO (Recenze Ceny)

**Scope:** only slug `smoking-cessation` (`https://recenze-ceny.cz/category/smoking-cessation`). Do **not** reuse copy, section templates, or keyword lists from other site hubs. Do **not** polish or extend the current thin page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for `smoking-cessation`.

---

## Dual role

1. **Czech SEO specialist** — win commercial DS intent (`doplňky stravy na odvykání kouření`, kapsle, přírodní prostředky) while explaining how pharmacy **NRT** and **OTC cytisin** differ — without trying to outrank Nicorette-style drug hubs head-on.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → DS vs NRT vs cytisin → byliny → forms/tables → safety → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `doplňky stravy na odvykání kouření`, `kapsle na odvykání kouření`, `jak přestat kouřit přípravky`, `přírodní prostředek proti kouření`, `kudzu odvykání kouření`, `odvykání kouření tablety`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| Pharmacy category hub | Lékárna.cz «Léky a přípravky na odvykání kouření»; GigaLékárna / Magistra / TRIO NRT shelves | Intro ~80–150 words + product grid; H2 «Co funguje» listing **náplasti / žvýkačky / spreje / doplňky** | E-com listing; brand-heavy | Practical, shop-first |
| OTC cytisin education | Defumoxan/Heavis PI; Magistra / BENU dosing tables; VZP contribution pages | **25denní schéma**, quit-by-day-5 rule, table of daily max doses | Product / Article | Label-led, clinical |
| Educational articles | Lékárna.cz článek; Magistra NRT guides; uLékaře-style «sám / odborník / přípravky» | Abstinenční příznaky → NRT forms → kombinace → odborná pomoc; 800–2000+ words | Article / FAQ | Calm, medical-adjacent |
| Natural / DS landings | Herbal capsule PDPs; kudzu addiction support articles; Bachovky / EO «stop kouření» | Složení table; benefit bullets; disclaimer «doplněk ≠ lék»; craving + stress angle | Often weak schema | Salesy risk — **do not copy claim style** |
| Byliny sidebars | Lékárna «přírodní pomocníci» (lípa, meduňka, třezalka, puškvorec, chrom/vláknina) | Short herb list as support during craving / sweet tooth / stress | Article section | Soft traditional |

### Winning patterns to absorb

1. Explicit **three-way split**: nikotinová substituční terapie (NRT) vs volně prodejný lék s cytisinem vs **doplněk stravy** (podpora režimu, ne lék).
2. Name **abstinenční příznaky** (craving, podrážděnost, chuť k jídlu, nespavost) so PAA and body match search language — without promising cure.
3. Named **byliny / složky** education (kudzu, chaga, meduňka, lípa, třezalka, puškvorec, chrom, vitaminy B/C) — label literacy, not medical protocol.
4. **Délka kúry** + plán odvykání + realistická očekávání; combination with NRT only with pharmacist/doctor advice.
5. Comparison tables (forms + method types) + checklist bullets «na co se dívat».
6. Compliant wording: «podpora / přispívá k / může usnadnit» — never «léčí / vyléčí / zaručený výsledek / přestanete kouřit za X dní».

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- 1-sentence sections → multi-paragraph useful copy (~800–1200 words total hub body).
- Missing H2: DS vs NRT vs cytisin; časté byliny/složky.
- Wrong forms table (no gel/krém — use kapsle / kapky; optional pastilky only if framed as DS).
- Weak PAA; thin intro without selection value (how to choose, vs NRT, COD).

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping block, `/pruvodce/smoking-cessation` sibling for deep guide.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep medical encyclopedia / full quit protocol → leave for `/pruvodce/smoking-cessation` (link it; do not duplicate).

**Forbidden:** competitor brand names (Nicorette, Niquitin, Defumoxan, Heavis, Smoklin, Nicotinon, Nicotine Free, Tabex, …); «léčí / vyléčí / zaručený výsledek»; fake AggregateRating; inventing product SKUs/rows for ItemList; claiming DS replaces NRT or cytisin therapy.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy na odvykání kouření`
- **secondaryKeywords:** kapsle na odvykání kouření, přírodní prostředek proti kouření, přípravky na odvykání kouření, prostředek proti kouření, abstinenční příznaky, chuť na cigaretu, nikotinová substituční terapie, cytisin, kudzu, chaga, meduňka, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words total); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; DS ≠ lék / NRT; brief vs pharmacy NRT shelf.
2. Sections (ids mandatory):
   - `pro-koho` — adults planning to cut down / quit; when to see a doctor (heavy dependence, pregnancy, CVD)
   - `jak-vybrat` — checklist bullets (cíl režimu, délka kúry, složení/mg, forma, kombinace s NRT, realistická očekávání)
   - `doplnek-vs-nrt` — doplněk stravy vs NRT (náplasti/žvýkačky/spreje) vs OTC cytisin tablets
   - `byliny` — LSI herbs/ingredients education (no competitor brands, no dosing as medical protocol)
   - `formy` — kapsle / kapky (no gel/krém)
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Forms: Kapsle | Kapky × kdy zvolit × na co se dívat
   - Methods: Doplněk stravy | NRT | OTC cytisin × co řeší × na co myslet
4. `hubLinks` (site-relative only):
   - `/pruvodce/smoking-cessation`
   - `/delivery`
   - `/medical-expert`
   - `/category/respiratory-health`
   - `/category/nervous-system`
5. FAQ 6–8 topic pairs (kúra length, kombinace s NRT, DS vs lék, byliny, těhotenství, kdy k lékaři, craving). COD/delivery PAA are merged by the app — omit pure shipping FAQs.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "smoking-cessation",
  "name": "Odvykání kouření",
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
    { "label": "…", "path": "/pruvodce/smoking-cessation" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na odvykání kouření",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na odvykání kouření — od … Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy na odvykání kouření",
    "descriptionAngle": "DS podpora + vs NRT + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `doplňky stravy na odvykání kouření`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `doplnek-vs-nrt`, `byliny`, `bezpecnost`
- [ ] `hubTables.length >= 2` and **no** gel/krém rows
- [ ] `hubLinks.length >= 5` with paths starting `/`
- [ ] No competitor brand names; no «léčí/vyléčí»
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
