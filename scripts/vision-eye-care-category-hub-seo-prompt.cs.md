# One-shot prompt — `/category/vision-eye-care` hub SEO (Recenze Ceny)

**Scope:** only slug `vision-eye-care` (`https://recenze-ceny.cz/category/vision-eye-care`). Do **not** reuse copy, section templates, or keyword lists from other site hubs. Do **not** polish or extend the current thin page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for `vision-eye-care`.

---

## Dual role

1. **Czech SEO specialist** — beat pharmacy category hubs (Vitalpoint, Lékárna.cz, EUC), ingredient hubs (BENU lutein), and educational articles on usefulness + commercial intent for adult **doplňky stravy na zrak / oči**.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → lutein/zeaxantin → kapsle vs kapky vs brýle → tables → safety → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `doplňky stravy na zrak`, `doplňky stravy pro oči a zrak`, `doplňky stravy na ochranu očí`, `lutein`, `vitamíny na oči`, `kapsle na oči lutein`, `vitamíny na oči při práci u počítače`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| Indication / category hub | Vitalpoint «Doplňky stravy pro oči a zrak»; Lékárna.cz «ochranu očí»; EUC «Oči a zrak» | Short commercial intro + product grid; long editorial tail: proč pečovat → obtíže → tipy péče → **lutein / omega / A / C / E / Zn / Se** bullets | E-com Collection / listing | Practical, shop-first + education |
| Ingredient hub | BENU `/lutein` | H1 «Lutein - produkty…»; sections **Co je lutein? / Kdy užívat?**; ~1k words page; sleva in title | Organization + Product | Ingredient-led, dosage narrative |
| Pharmacy PDP | Ocuvite / Ocutein-style eye formulas | Composition **mg tables** (lutein, zeaxanthin, zinc, C, E); «zinek přispívá k udržení normálního stavu zraku»; gradual-release claims | Product + Breadcrumb | Label-led, EFSA-compliant |
| Educational article | Magistra vitamins for eyes; CVS / PC eye blogs | Long H2: blue light, 20-20-20, dry eye, AREDS context, 6–20 mg lutein ranges | Article / FAQ | Calm, medical-adjacent |

### Winning patterns to absorb

1. Primary commercial H1/title intent: **doplňky stravy na zrak** (keep; already ranks commercially).
2. Named **účinné látky** education: lutein, zeaxantin, zinek, vitamin A/C/E, omega-3 (DHA), extrakt z borůvek / měsíčku — not just «sledujte složení».
3. Explicit split: **ústní doplněk (kapsle/tablety)** vs **oční kapky** vs **brýle / optika** — hub sells DS selection, not gadgets.
4. Office-eye context: monitory, modré světlo, pravidlo **20-20-20**, suché oči as regime — plus kdy k očaři.
5. Mg ranges as **selection orientation** (e.g. lutein often 6–20 mg/den in consumer formulas) — never as medical protocol or «léčí VPMD».
6. Compliant wording: «podpora / přispívá k» — never «léčí / vyléčí / obnoví zrak / zaručený výsledek».
7. Comparison tables (forms + účinné látky) + checklist bullets «na co se dívat».
8. Safety: záblesky, výpadek zorného pole, bolest oka, náhlá ztráta zraku → okamžitě lékař; těhotenství/kojení/léky na předpis → konzultace.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- 1-sentence sections → multi-paragraph useful copy (~800–1200 words total hub body).
- Missing H2: lutein/zeaxantin education; kapsle vs oční kapky vs brýle.
- Wrong default forms table (no gel/krém for eyes — use kapsle/tablety; mention kapky as pharmacy category, not our DS shelf).
- Weak PAA; thin intro without comparison value (how to choose, COD, office-eye).

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping block, `/pruvodce/vision-eye-care` sibling for deep guide.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep ophthalmology encyclopedia → leave for `/pruvodce/vision-eye-care` (link it; do not duplicate full medical article).

**Forbidden:** competitor brand names (Ocuvite, Ocutein, Walmark, Macushield, Generica, Protectum, Jamieson, …); «léčí / vyléčí / obnoví zrak / zaručený výsledek»; fake AggregateRating; inventing product SKUs/rows for ItemList; promising cure of cataract / glaucoma / AMD.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy na zrak`
- **secondaryKeywords:** doplňky stravy pro oči a zrak, doplňky stravy na ochranu očí, vitamíny na oči, kapsle na oči, lutein, zeaxantin, zeaxanthin, zinek na zrak, omega-3 DHA oči, extrakt z borůvek, únava očí z monitoru, modré světlo, platba na dobírku
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words total); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; DS ≠ lék / oční vyšetření; brief office-eye + výběr podle složení.
2. Sections (ids mandatory):
   - `pro-koho` — adults with screen fatigue / age-related comfort goals; when to see ophthalmologist first
   - `jak-vybrat` — checklist bullets (lutein/zeaxantin mg, zinek, délka kúry, s jídlem/tuk, cena/den, red flags)
   - `ucinne-latky` — lutein, zeaxantin, zinek, vitaminy, omega-3, borůvky (education, not dosing protocol)
   - `formy` — kapsle/tablety vs oční kapky vs brýle (clear split)
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Forms: Kapsle/tablety | (pharmacy) oční kapky | brýle/optika × kdy zvolit × na co se dívat
   - Účinné látky: látka × k čemu se vztahuje × tip při výběru
4. `hubLinks` (site-relative only):
   - `/pruvodce/vision-eye-care`
   - `/delivery`
   - `/medical-expert`
   - `/category/nervous-system`
5. FAQ 6–8 topic pairs (vyšetření, délka užívání, kolik luteinu, kapsle vs kapky, s jídlem, kdy k očaři, těhotenství). COD/delivery PAA are merged by the app — you may omit pure shipping FAQs.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "vision-eye-care",
  "name": "Zrak",
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
    { "label": "…", "path": "/pruvodce/vision-eye-care" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na zrak",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na zrak — od … Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy na zrak",
    "descriptionAngle": "lutein + office-eye + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `doplňky stravy na zrak`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `ucinne-latky`, `formy`, `bezpecnost`
- [ ] `hubTables.length >= 2` and forms rows reflect kapsle / kapky / brýle (not gel/krém)
- [ ] `hubLinks.length >= 4` with paths starting `/`
- [ ] No competitor brand names; no «léčí/vyléčí/obnoví zrak»
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
