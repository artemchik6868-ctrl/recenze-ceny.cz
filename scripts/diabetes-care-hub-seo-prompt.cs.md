# One-shot prompt — `/category/diabetes-care` only (Recenze Ceny, cs-CZ)

Do **not** reuse this for other categories. Source of truth = Czech SERP competitors for diabetes / blood-glucose supplements, **not** existing hub copy on this site and **not** other category pilots.

## Role

You are a Czech SEO specialist + UX writer for a commercial category hub about **doplňky stravy na cukrovku**. Output must win commercial queries against pharmacy category hubs and educational articles while staying YMYL-compliant (doplněk ≠ lék; no cure claims).

## Competitor strengths to beat (observed CZ SERP)

- **MujLekarnik `/diabetes-cukrovka-74_prehled/`**: commercial H1 «Co na cukrovku», short trust intro (podpůrná funkce, chrom, kyselina lipoová), assortment + form filters, pharmacist consultation CTA.
- **BENU `/doplnky-stravy-na-hladinu-cukru`**: commercial category title, educational block «Jak snížit cukr v krvi», ingredient list (gurmar, borůvka, pískavice, česnek), bestsellers.
- **Magistra `/doplnky-stravy-pro-diabetiky`**: longer edu paragraph — chrom, gurmar, hořčík, vitaminy B, ALA, omega-3, oční podpora; sugar-in-excipients note.
- **EUC Lékárna blog `Diabetes a doplňky stravy`**: ingredient-by-ingredient depth (ALA + B, omega-3, CoQ10…), konzultace s lékařem, hypoglykémie warning.
- **Kantesti evidence guide**: glykémie / HbA1c orientační rozmezí, co má lepší důkazy (berberin, ALA neuropatie, vláknina), rizika (Cassia/kumarin, stacking s inzulinem), urgent patterns.
- **Lékárna V Italské (gymnema + chrom)**: dosing context, «kdy zvolit», mýty vs fakta, prediabetes vs DM2.
- **Product PDPs (Walmark chrom+skořice, Aktin glucose control)**: composition tables, EFSA-style chrom claims («přispívá k udržení normální hladiny glukózy»).

### Steal structure, never copy text

Must-have blocks competitors win with that we must out-execute:

1. Commercial H1/title = primary KW
2. Intro with primary KW in sentence 1 + assortment + disclaimer + shipping/COD
3. How-to-choose by goal (glykémie po jídle / denní podpora / neuropatie-komfort) + form + drug compatibility
4. **Orientační hodnoty** table (glykémie nalačno / HbA1c frames — not a diagnostic tool)
5. Forms comparison table (kapsle, kapky, vláknina; skip irrelevant gel/cream unless justified)
6. Ingredients / LSI table (chrom, skořice, gurmar/gymnema, berberin, ALA, morušovník, pískavice, hořčík/D, vláknina)
7. Short educational context (prediabetes vs DM2 podpora — not a medical textbook)
8. Dedicated režimová opatření H2 (strava, pohyb, měření glukózy, spánek)
9. Strong safety callout (≠ inzulin/metformin; hypoglykémie; kdy k lékaři)
10. FAQ covering PAA (léky, užívání, interakce, měření) — shipping/COD merged elsewhere

## Keyword map

- **Primary:** `doplňky stravy na cukrovku`
- **Secondary:** `doplňky stravy na hladinu cukru`, `doplňky stravy pro diabetiky`, `přírodní prostředky na cukrovku`, `doplněk na cukr v krvi`, `chrom a skořice`, `gurmar`, `berberin cukrovka`, `kyselina alfa-lipoová diabetes`, `prediabetes doplněk`
- **PAA:** nahrazuje léky?, interakce s inzulinem/metforminem, hypoglykémie, jak dlouho užívat, jak měřit glykémii, chrom vs gurmar

## UX constraints (renderer)

Plain Czech text only (no HTML/Markdown). App builds: TOC, `<h2>`, `<p>`, `<ul>`, tables, safety `<aside>`, absolute internal links.

## Compliance

- Use „podpora / přispívá k / může podporovat“ — never „léčí / vyléčí / zabíjí cukr / zaručeně sníží HbA1c“.
- Doplněk stravy nenahrazuje inzulin, metformin ani jinou předepsanou léčbu.
- Orientační hodnoty = education only, not self-diagnosis.
- Deep buying guide → link path `/pruvodce/diabetes-care` (do not dump full medical TOC on hub).
- No competitor brand names. No fake ratings/reviews. No product names from SERP (DiEffect, DIMizin, Walmark…).

## Output JSON

```json
{
  "slug": "diabetes-care",
  "name": "Péče o cukrovku",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… primaryKeyword in sentence 1, ~80–120 words …",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat …", "body": "…", "bullets": ["…"] },
    { "id": "hodnoty-glykemie", "heading": "…", "body": "…" },
    { "id": "slozky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "rezim", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Orientační hodnoty glukózy a HbA1c (vzdělávací rámec)",
      "headers": ["Kategorie", "Glykémie nalačno", "HbA1c (orientace)", "Co dělat"],
      "rows": [["…", "…", "…", "…"]]
    },
    {
      "caption": "Formy produktů — rychlé srovnání",
      "headers": ["Forma", "Kdy zvolit", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Časté složky v doplňcích na cukrovku",
      "headers": ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
      "rows": [["…", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Péče o cukrovku", "path": "/pruvodce/diabetes-care" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Vysoký krevní tlak", "path": "/category/blood-pressure" },
    { "label": "Kategorie: Kontrola hmotnosti", "path": "/category/weight-management" }
  ],
  "categoryFaq": [
    { "q": "…", "a": "…" }
  ],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na cukrovku",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  }
}
```

Write original Czech. Beat competitors on clarity, tables, PAA coverage, and scannability — not on word count alone.
