# Dedicated prompt — `/category/sleep-snoring` (Recenze Ceny CZ)

**Scope:** only this niche. Do NOT reuse joint-care / psoriasis / other hub templates. Orient exclusively on CZ SERP competitors below and beat them on structure, clarity, and helpfulness — never by copying brand names or paragraphs.

Output maps to `SupplementHubPack` (`serpLedHub: true`) + `CategorySeoIntent` for slug `sleep-snoring`.

---

## Dual role

1. **Czech SEO specialist** — win commercial + info intents for chrápání / přípravky / formy.
2. **UX designer for a catalog hub** — scannable in ~10 s: TOC → formy map → jak vybrat → tipy → tables → safety → FAQ. Product grid is above editorial (app-owned).

Tone: calm, pharmacy-adjacent cs-CZ. Realistic expectations. Genre: commercial category hub with strong info depth — not encyclopedia, not PDP, not deep medical treatise.

---

## Competitor brief (what to steal structurally)

### 123medik — «Nejlepší přípravky proti chrápání…»
- Title/H1 lead with commercial KW + form list in paren angle.
- TOC (Obsah) → intro with prevalence cue → early product/comparison table → H2 «Proč chrápeme?» → lifestyle → form cards (sprej / kapky / náplast) with pros/cons → doctor CTA.
- Weakness: affiliate noise, brand lock-in, thin FAQ schema.

### Cenový radar — sprej buying guides
- Criteria: where applied, taste, volume 25–50 ml, price band ~270–560 Kč.
- Short how-to-choose bullets — keep this scannability.

### iSpanek / Natima — tip lists
- Numbered lifestyle H2/H3 (bok, alkohol, nos, váha, zvlhčovač…).
- Dedicated **apnoe red flags** block → specialist / sleep lab.
- Capture info traffic that competitors convert later.

### Pharmacies (BENU, EUC, lekyprozdravi)
- Compliance: zdravotnický prostředek / doplněk stravy ≠ léčba spánkové apnoe; ≠ CPAP.
- Ingredient literacy without inventing medical claims.

### Patterns to implement (better than them)
1. TOC + anchor H2s (app builds TOC from sections).
2. Form map table early (sprej / kapky / náplast / kapsle) — **no competitor brand names**.
3. Goal × form matrix table (hlasitost vs usínání vs nos).
4. Optional apnoe red-flag table.
5. Pros/cons language, realistic expectations.
6. Numbered tipy as bullets under one H2 (not 10 separate H2 spam).
7. Hard safety callout — heading matches `/bezpečnost|kdy k lékaři/i`.
8. FAQ for PAA (feeds FAQPage). COD/delivery PAA are merged by app — do not duplicate.
9. Clickable internal `hubLinks` only (`/delivery`, `/medical-expert`, related categories, `/pruvodce/sleep-snoring`).

**Forbidden:** Pssst!, Adenol, Silence, Questaplast, Beurer, etc.; «léčí / vyléčí / zaručený spánek bez chrápání»; fake AggregateRating / fake product rows.

---

## Keyword strategy (hybrid)

| Role | Phrase |
|------|--------|
| **primaryKeyword** | `přípravky proti chrápání` |
| Secondary | `doplňky stravy proti chrápání`, `sprej proti chrápání`, `kapky proti chrápání`, `náplast proti chrápání`, `kapsle na spánek`, `prostředky proti chrápání`, `jak se zbavit chrápání`, `jak přestat chrápat`, `spánková apnoe`, `klidný spánek`, `platba na dobírku`, `doručení v České republice` |

- Intro sentence 1 must contain `primaryKeyword`.
- H1/title intent = primaryKeyword (runtime `buildCategoryHeadMeta`).
- Body must naturally cover formy + tipy + apnoe without stuffing.

---

## Required section skeleton

1. `pro-koho` — who the hub helps; partner context; when not enough.
2. `proc-chrapeme` — mechanism in plain Czech (vibrace měkkého patra / nos / poloha).
3. `mapa-forem` — sprej, kapky, náplast, kapsle — when each makes sense.
4. `jak-vybrat` (**id must be `jak-vybrat`**) — goal → form → etiketa → cena cyklu.
5. `tipy-rezim` — 7 lifestyle tipy as bullets (bok, alkohol, kouření, nos, váha, zvlhčení, polštář/elevace).
6. `bezpecnost` — heading «Bezpečnost a kdy k lékaři» — doplněk ≠ lék ≠ CPAP; apnoe red flags.

Intro: 80–120 words across 1–2 paragraphs. Each section body: ~60–120 words + bullets where useful.

---

## Tables (min 2, prefer 3)

1. Formy — Forma | Kdy zvolit | Na co se dívat  
2. Cíl × větev — Cíl | Vhodná větev | Realistické očekávání  
3. Apnoe signály — Signál | Co udělat  

---

## FAQ (6–8 topic Q&A, plain text, stand-alone answers)

Cover: does OTC help; sprej vs kapky vs náplast; how long to try; partner snoring; apnoe vs ordinary snoring; doplněk vs lékař; sleep capsules vs throat spray purpose.  
Do **not** add dobírka/doručení/originalita — app merges those from seo-intent DEFAULT_PAA.

---

## Compliance

- «doplněk stravy» / «zdravotnický prostředek» — podpora / zmírnění komfortu, never léčba.
- Spánková apnoe → lékař / spánková laboratoř / ORL; not e-shop first.
- No dosing invented as medical prescription — «dle návodu na obalu».

---

## Output JSON schema

```json
{
  "slug": "sleep-snoring",
  "name": "Spánek a chrápání",
  "serpLedHub": true,
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… (přípravky proti chrápání in sentence 1)",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "proc-chrapeme", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "mapa-forem", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat přípravky proti chrápání", "body": "…", "bullets": ["…"] },
    { "id": "tipy-rezim", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    { "caption": "…", "headers": ["…"], "rows": [["…"]] }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Spánek a chrápání", "path": "/pruvodce/sleep-snoring" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Proti stresu", "path": "/category/nervous-system" },
    { "label": "Kategorie: Odvykání kouření", "path": "/category/smoking-cessation" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "přípravky proti chrápání",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Přípravky proti chrápání — Recenze Ceny",
    "h1Example": "Přípravky proti chrápání",
    "descriptionAngle": "formy + realistická očekávání + dobírka"
  }
}
```

`metaHints.titleExample` ≤ 60 chars; must start with primary KW intent.

---

## Checklist before paste into TS

- [ ] `serpLedHub: true`
- [ ] primaryKeyword in intro sentence 1
- [ ] `id: "jak-vybrat"` present
- [ ] Safety heading matches `/bezpečnost|kdy k lékaři/i`
- [ ] ≥2 hubTables; no competitor brands
- [ ] hubLinks paths start with `/`
- [ ] FAQ 6–8 topic pairs, no COD duplicates
- [ ] No medical cure claims
