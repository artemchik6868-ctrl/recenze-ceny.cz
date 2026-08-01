# One-shot prompt — `/category/psoriasis` hub SEO (Recenze Ceny)

**Scope:** only slug `psoriasis` (`https://recenze-ceny.cz/category/psoriasis`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (fungus, alcoholism, smoking-cessation, …). Do **not** polish or extend any existing thin page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Catalog will expand:** cover **all forms equally** (krém / mast / gel / balzám / šampon + kapsle / kapky). Do **not** write as capsules-only even if today’s live grid is small.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for `psoriasis`. Set mental flag `serpLedHub: true` (custom sections, no thin `pack()` skeleton).

---

## Dual role

1. **Czech SEO specialist** — win commercial cluster around `doplňky stravy na lupénku` **plus** lokální intent (`krém na lupénku`, mast, gel) while clearly separating **doplněk stravy / kosmetická péče** from **dermatologická léčba** (kortikoidy, analogy vitaminu D, fototerapie, biologika) — without trying to outrank pharmacy encyclopedias head-on.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → layers of care → how to choose → forms → složky → triggers → safety → FAQ. Calm pharmacy-adjacent tone (cs-CZ). YMYL: honest, never salesy cure claims. Tables as visual anchors (competitors often have **0 tables** — that is our edge).

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `lupénka krém recenze`, `doplňky stravy na lupénku`, `psoriáza přírodní léčba`, `lupénka léčba`, pharmacy category + blog hubs.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| Affiliate cream roundup | «12 nejlepších krémů na lupénku» style | ~3000+ words; H1 with number; TOC; TOP-3 cards + price; numbered SKU list; H2 Co je / Typy / Jak poznat / Redukovat; per-product H2 | Title KW-first; Q&A description; Article+Breadcrumb; often **0 tables** | Conversational «recenze» |
| Supplement lifestyle blog | Omega-3 / D3 / mikrobiom / stres tips | TOC; numbered lifestyle tips; nutrient sections; product cards; FAQ; study links | Article; strong YMYL disclaimer | Calm evidence |
| Pharmacy encyclopedia | «Lupénka: komplexní přehled», article «10 způsobů…» | Typy, mýty, komorbidity (artritida), OTC emoliencia, Rx hint | Category / article | Medical retail |
| Pharmacy OTC shelf | Ekzémy a lupénka, šampony na lupénku | Short intro + filters + reviews | Product list | Retail shelf |
| PDP / aggregates | Heureka / Zboží cream ratings | Pros/cons, % rating, price | Product | UGC — steal expectancy realism only |

### Winning patterns to absorb

1. Explicit **three layers**: dermatolog/Rx → lokální péče (krém, mast, gel, balzám, šampon) → perorální DS (kapsle/kapky) as režimová podpora — **both commercial branches equal**.
2. **Multi-form table** — when lokální vs vnitřní; combination possible after konzultace; hub must **not** sound like «kategorie kapslí».
3. **Label literacy** (not medical protocol): lokálně — emoliencia, konopí, aloe, urea, CBD (ingredient *types*, not brands); vnitřně — omega-3, vitamin D, kurkumin, probiotika / gut-skin.
4. **Triggers** of vzplanutí: stres, alkohol, kouření, infekce, některé léky — short bullets.
5. Comparison tables + checklist «na co se dívat» + test snášenlivosti for topicals.
6. Compliant wording: «podpora / přispívá k / může ulevit» — never «vyléčí lupénku / zbaví ložisek za X dní / zaručený výsledek».
7. Commercial meta: primary KW first; assortment (lokální + DS) + dobírka + ČR.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- 1-sentence sections → multi-paragraph useful copy (~900–1300 words total hub body).
- Missing H2: vrstvy péče; multi-form shelf; složky; spouštěče.
- Wrong related link to fungus — replace with joint-care / nervous-system / anti-aging.
- Weak PAA; thin intro without selection value.

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping block, `/pruvodce/psoriasis` sibling for deep guide.

**Anti-cannibalization:** hub = selection + forms + tables + FAQ. Deep medical encyclopedia / full treatment protocol → leave for `/pruvodce/psoriasis` (link it; do not duplicate).

**Forbidden:** competitor product/brand names (Mediderm, Epiderma, Soratinex, Dr. Michaels, Cutishelp, HillVital, Psozoil, CBD STAR, Annabis, Saloos, Linola, Excipial, Bepanthen, …); «léčí / vyléčí / zaručený výsledek»; fake AggregateRating; inventing product SKUs/rows for ItemList; claiming DS/kosmetika replaces Rx dermatology or biologics.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy na lupénku`
- **secondaryKeywords:** krém na lupénku, mast na lupénku, gel na lupénku, kapsle na lupénku, přípravky na lupénku, přírodní péče při psoriáze, omega-3 lupénka, vitamin D lupénka, probiotika pokožka, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing. Actively cover cream/mast intent for expanding shelf.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words total); primary KW in sentence 1; katalog = lokální + perorální; dobírka + 2–5 dnů + ČR; DS/kosmetika ≠ léčba.
2. Sections (ids mandatory):
   - `pro-koho` — adults with milder/stable psoriasis seeking supportive care; when NOT (rozsáhlé vzplanutí, děti, těhotenství → dermatolog)
   - `vrstvy-pece` — Rx / lokální / perorální DS
   - `jak-vybrat` — checklist (cíl péče, volba formy, složení, délka kúry, cena cyklu, očekávání, test snášenlivosti)
   - `formy` — krém / mast / gel / balzám / šampon / kapsle / kapky equally
   - `slozky` — lokální typy + vnitřní (omega-3, D, kurkumin, probiotika)
   - `spoustece` — stres, alkohol, kouření, infekce, léky
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 3:
   - Vrstvy péče: Dermatolog/Rx | Lokální péče | Perorální DS
   - Formy: Krém | Mast | Gel/balzám | Šampon | Kapsle | Kapky × kdy zvolit × na co se dívat
   - Složky: lokální typy + omega-3 | vitamin D | kurkumin | probiotika
4. `hubLinks` (site-relative only):
   - `/pruvodce/psoriasis`
   - `/delivery`
   - `/medical-expert`
   - `/category/joint-care` (psoriatická artritida awareness only — not claiming joint cure)
   - `/category/nervous-system` (stres)
   - `/category/anti-aging` (péče o pokožku)
5. `categoryFaq` — 6–8 topical Q&A (plain text, no HTML). Shipping/COD may be omitted (merged later).
6. `keywordsHi` — primary + commercial/form/ingredient LSI + dobírka/ČR.
7. `taglineHi` / `shortDescHi` — one-liners; mention lokální + DS mix.
8. `paaQuestions` — cream vs kapsle, jak dlouho, kdy k dermatologovi, omega-3, spouštěče, etc.

---

## Compliance (hard)

- Always: «doplněk stravy / kosmetická péče, nikoli lék»; «nenahrazuje dermatologickou léčbu lupénky».
- Never promise clearance of plaques or cure of psoriasis.
- Red flags → dermatolog: rozsáhlé vzplanutí, hnisání, silná bolest, postižení kloubů s otoky, děti, těhotenství, zhoršení po samoléčbě.
- Can mention generic care layers (kortikoidy, fototerapie, biologika) as **Rx context only**, not products we sell.

---

## Output JSON schema

```json
{
  "slug": "psoriasis",
  "name": "Psoriáza",
  "tagline": "…",
  "shortDesc": "…",
  "primaryKeyword": "doplňky stravy na lupénku",
  "secondaryKeywords": ["…"],
  "categoryIntro": "… (primaryKeyword in sentence 1)",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "vrstvy-pece", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat …", "body": "…", "bullets": ["…"] },
    { "id": "formy", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "slozky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "spoustece", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    { "caption": "…", "headers": ["…"], "rows": [["…"]] }
  ],
  "hubLinks": [{ "label": "…", "path": "/…" }],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywordsHi": ["…"],
  "paaQuestions": ["…"]
}
```

Write natural Czech only. No markdown outside JSON. No English keys inside string values.
