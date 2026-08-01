# One-shot prompt — `/category/nervous-system` only (Recenze Ceny, cs-CZ)

Do **not** reuse this for other categories. Source of truth = Czech SERP competitors for stress / nervy / spánek supplements, not existing hub copy on this site.

## Role

You are a Czech SEO specialist + UX writer for a commercial category hub about **doplňky stravy na stres** (shelf name: Proti stresu; URL slug: `nervous-system`). Output must win commercial queries against pharmacy/e-shop hubs while staying compliant (doplněk ≠ lék / ≠ psychoterapie).

## Competitor strengths to beat (observed)

- **BENU `/doplnky-stravy-na-nervy`**: long SEO text after product grid; H2 „Co pomáhá na nervy a stres?“; ingredient education (B1/B6/B12, hořčík, omega-3, L-theanin, tryptofan); lifestyle + konzultace s lékařem/lékárníkem.
- **BENU `/spanek`**: split usínání vs spánek; byliny (meduňka, levandule, mučenka, kozlík); režim + večerní rutiny.
- **BENU `/leky-na-deprese-a-stres`**: symptom list (neklid, úzkost, koncentrace, nespavost); OTC herb narrative (kozlík, meduňka, levandule) with clear „léčivý přípravek vs doplněk“ boundary — we sell **doplňky**, so explain the difference without naming competitor brands.
- **Magistra `/nervovy-system-na-nervy`**: commercial H1 „Doplňky stravy na nervový systém“; dense catalog; B-komplex / ALA / regenerace nervů framing.
- **Zdravoslav / GigaLékárna / psychiatry blogs**: herb encyclopedia (levandule, kozlík, meduňka, mučenka, ašvaganda, rozchodnice, třezalka); hard safety (třezalka interakce; byliny ≠ léčba deprese/úzkostné poruchy).

### Steal structure, never copy text

Must-have blocks competitors win with that we must out-execute:

1. Commercial primary KW in intro sentence 1 + assortment + disclaimer + shipping/COD
2. How-to-choose by **goal** (denní klid vs večerní spánek) + složení + léky
3. Dedicated H2: denní klid vs večerní spánek (BENU usínání/spánek pattern)
4. Ingredients / LSI section + table (hořčík, B-komplex, L-theanin, ašvaganda, rozchodnice, kozlík, meduňka, mučenka, levandule, omega-3 — mention třezalka only as caution)
5. Režimová opatření H2 (spánek, pohyb, kofein, obrazovky)
6. Forms comparison: kapsle / kapky / bylinný čaj — **not** gel/krém
7. Strong safety callout (≠ anxiolytikum; sebevražedné myšlenky / akutní úzkost → odborná pomoc ihned)
8. FAQ covering PAA + shipping/COD
9. Clickable internal paths only (no competitor URLs)

## Keyword map

- **Primary:** `doplňky stravy na stres`
- **Secondary:** `doplňky stravy na nervy`, `doplňky na nervový systém`, `doplňky na stres a spánek`, `přírodní prostředky na úzkost`, `hořčík na stres`, `B-komplex na nervy`, `ašvaganda stres`
- **PAA:** pomáhá při stresu a nespavosti; kombinace s léky na úzkost; jak dlouho užívat; doplněk vs lék; kdy k lékaři; byliny večer vs přes den

## UX constraints (renderer)

Plain Czech text only (no HTML/Markdown). App builds: TOC, `<h2>`, `<p>`, `<ul>`, tables, safety `<aside>`, absolute internal links.

Section ids (use exactly): `pro-koho`, `jak-vybrat`, `klid-vs-spanek`, `slozky`, `rezim`, `formy`, `bezpecnost`.

Three hub tables required:

1. Cíl podpory — denní klid vs večerní spánek
2. Formy produktů — kapsle / kapky / čaj
3. Časté složky v doplňcích na stres a nervy

## Compliance

- Use „podpora / přispívá k / může podporovat“ — never „léčí / vyléčí / zaručeně uklidní / odstraní úzkost“.
- Doplněk stravy nenahrazuje psychoterapii, psychiatrickou léčbu ani anxiolytika na předpis.
- Deep buying guide → `/pruvodce/nervous-system` (do not dump full medical TOC on hub).
- Related category link → `/category/sleep-snoring`.
- No competitor brand names (Persen, Magne B6 brand packaging, Neuromedic, etc.). No fake ratings/reviews.
- Catalog may include mixed SKUs (stres / paměť / neuropatie) — hub copy stays on **stres, klid, nervový systém, spánek**; do not promise neuropathy cure.

## Output JSON

```json
{
  "slug": "nervous-system",
  "name": "Proti stresu",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… primaryKeyword in sentence 1, ~80–120 words …",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat doplňky stravy na stres", "body": "…", "bullets": ["…"] },
    { "id": "klid-vs-spanek", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "slozky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "rezim", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "formy", "heading": "…", "body": "…" },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Cíl podpory — denní klid vs večerní spánek",
      "headers": ["Cíl", "Kdy dává smysl", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Formy doplňků stravy na stres — rychlé srovnání",
      "headers": ["Forma", "Kdy zvolit", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Časté složky v doplňcích na stres a nervy",
      "headers": ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
      "rows": [["…", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Proti stresu", "path": "/pruvodce/nervous-system" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Spánek a chrápání", "path": "/category/sleep-snoring" }
  ],
  "categoryFaq": [
    { "q": "…", "a": "…" }
  ],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na stres",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  }
}
```

Write original Czech. Beat competitors on clarity, tables, PAA coverage, and scannability — not on word count alone. Include 6–8 thematic FAQ items (shipping/COD may be included; app may also merge defaults).
