# One-shot prompt — `/category/alcoholism` hub SEO (Recenze Ceny)

**Scope:** only slug `alcoholism` (`https://recenze-ceny.cz/category/alcoholism`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (smoking-cessation, joint-care, …). Do **not** polish or extend any existing thin page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for `alcoholism`.

---

## Dual role

1. **Czech SEO specialist** — win commercial DS intent (`doplňky stravy při odvykání alkoholu`, přípravky / kapsle / kapky, přírodní podpora) while clearly separating **doplněk stravy** from **léky na předpis** (disulfiram, naltrexon, acamprosát) and from medical detox — without trying to outrank addiction-clinic encyclopedias head-on.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → DS vs Rx → složky → forms/tables → safety → FAQ. Calm pharmacy-adjacent tone (cs-CZ). YMYL: honest, never salesy cure claims.

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `doplňky stravy při odvykání alkoholu`, `přípravky na odvykání alkoholu`, `jak přestat pít alkohol doplňky`, `vitaminy skupiny B alkoholismus`, `ostropestřec mariánský alkohol játra`, `kudzu alkohol`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| Category encyclopedia hub | Online pharmacy «Alkoholismus» category with Rx SKUs | Long H2/H3: příznaky, stadia, diagnostika, farmakologie, hepatoprotektiva, vitaminy/minerály, psychoterapie, rodina, zdroje pomoci (~1500–3000+ words) | Weak commercial H1 («Alkoholismus»); product grid of Rx | Medical encyclopedia |
| Affiliate / pseudo-pharmacy PDPs | Alco-branded kapsle/kapky landings | Pro koho bullets, složení, dávkování, FAQ, param tables; often overclaims «léčba závislosti» | Product-heavy titles; brand queries | Salesy — **do not copy claim style** |
| Quit-alcohol education | Practical step guides (příprava → abstinenční příznaky → cold turkey vs lékařský detox → relaps) | Numbered TOC; strong YMYL safety on withdrawal | Article / FAQ | Calm, authoritative |
| Liver / silymarin articles | Pharmacy Q&A + blog «regenerace jater po alkoholu» | Abstinence first; silymarin / fosfolipidy as **podpora**; diet + hydration | Article | Evidence-cautious |
| Kudzu / herb education | Vitality shops + herb blogs on pueraria | Složka education; «není lék»; caps vs tea | Product / blog | Traditional soft |

### Winning patterns to absorb

1. Explicit **split**: doplněk stravy (podpora režimu / regenerace) vs **léky na předpis** (anticraving / senzitizace) vs **lékařský detox** při odvykacích stavech.
2. Name **živiny a hepatoprotektiva** that searchers expect: vitaminy skupiny B (thiamin B1), C, hořčík, zinek, silymarin / ostropestřec, kudzu — as **label literacy**, not medical protocol.
3. **Bezpečnost odvykání**: třes, úzkost, záchvaty, delirium = lékařská péče; cold turkey u silné závislosti je rizikový — hub must say this clearly.
4. Comparison tables (forms + složky or DS vs Rx) + checklist bullets «na co se dívat».
5. Compliant wording: «podpora / přispívá k / může usnadnit» — never «léčí alkoholismus / vyléčí závislost / zaručený výsledek / přestanete pít za X dní».
6. Commercial meta pattern: primary KW first; assortment + dobírka + ČR in description.

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- 1-sentence sections → multi-paragraph useful copy (~900–1300 words total hub body).
- Missing H2: DS vs léky na předpis; časté složky (B-komplex, silymarin, kudzu, minerály).
- Wrong/generic forms table (no gel/krém — use kapsle / kapky).
- Weak PAA; thin intro without selection value (how to choose, vs Rx, liver angle, COD).

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping block, `/pruvodce/alcoholism` sibling for deep guide.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep medical encyclopedia / full quit protocol → leave for `/pruvodce/alcoholism` (link it; do not duplicate).

**Forbidden:** competitor product/brand names (AlcoWin, Alcozar, Alkotox, Detoplex, Antabus, Adepend, Campral, Selincro, Essentiale, Flavobion, …); «léčí / vyléčí / zaručený výsledek»; fake AggregateRating; inventing product SKUs/rows for ItemList; claiming DS replaces Rx therapy or medical detox; recommending self-detox for heavy drinkers.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy při odvykání alkoholu`
- **secondaryKeywords:** přípravky na odvykání alkoholu, přírodní prostředky proti alkoholu, kapsle na odvykání alkoholu, kapky proti alkoholismu, vitaminy skupiny B alkohol, thiamin, ostropestřec, silymarin, kudzu, hepatoprotektiva, hořčík, zinek, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words total); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; DS ≠ lék / Rx; brief vs «zázračná kúra».
2. Sections (ids mandatory):
   - `pro-koho` — adults reducing alcohol under a plan / with professional care; when NOT for self-purchase (heavy withdrawal, pregnancy, liver disease flares)
   - `jak-vybrat` — checklist bullets (cíl režimu, DS vs lékařská péče, složení/mg, forma, délka kúry, realistická očekávání)
   - `doplnek-vs-leky` — doplněk stravy vs léky na předpis (disulfiram / naltrexon / acamprosát — generic INN only) vs lékařský detox
   - `slozky` — B-komplex/thiamin, silymarin, kudzu, minerály (label literacy)
   - `formy` — kapsle / kapky (no gel/krém; warn if alcohol in tincture base)
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Forms: Kapsle | Kapky × kdy zvolit × na co se dívat
   - Složky: B-komplex | silymarin | kudzu | minerály × co řeší v kontextu podpory × tip
4. Optional 3rd table: Doplněk stravy | Léky na předpis | Lékařský detox
5. `hubLinks` (site-relative only):
   - `/pruvodce/alcoholism`
   - `/delivery`
   - `/medical-expert`
   - `/category/liver-health`
   - `/category/smoking-cessation`
   - optional `/category/detox-cleanse` if framed as general cleanse, not alcohol cure
6. `categoryFaq` — 6–8 topical Q&A (plain text, no HTML). Shipping/COD may be omitted (merged later).
7. `keywordsHi` — primary + commercial/ingredient LSI + dobírka/ČR.
8. `taglineHi` / `shortDescHi` — one-liners for shelf/meta problem angle.

---

## Compliance (hard)

- Always: «doplněk stravy, nikoli lék»; «nenahrazuje léčbu závislosti ani detoxifikaci».
- Never promise abstinence or craving elimination.
- Name emergency red flags: záchvaty, delirium, silný třes, zmatenost, sebevražedné myšlenky → okamžitě lékařská pomoc / tísňová linka (generic, no competitor clinic brands).
- Can mention Národní linka pro odvykání as public resource (not a competitor e-shop).

---

## Output JSON schema

```json
{
  "slug": "alcoholism",
  "name": "Alkoholismus",
  "tagline": "…",
  "shortDesc": "…",
  "primaryKeyword": "doplňky stravy při odvykání alkoholu",
  "secondaryKeywords": ["…"],
  "categoryIntro": "… (primaryKeyword in sentence 1)",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat …", "body": "…", "bullets": ["…"] },
    { "id": "doplnek-vs-leky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "slozky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "formy", "heading": "…", "body": "…" },
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
