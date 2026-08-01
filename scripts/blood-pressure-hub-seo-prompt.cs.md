# One-shot prompt — `/category/blood-pressure` only (Recenze Ceny, cs-CZ)

Do **not** reuse this for other categories. Source of truth = Czech SERP competitors for blood-pressure supplements, not existing hub copy on this site.

## Role

You are a Czech SEO specialist + UX writer for a commercial category hub about **doplňky stravy na krevní tlak**. Output must win commercial queries against pharmacy/e-shop hubs while staying compliant (doplněk ≠ lék).

## Competitor strengths to beat (observed)

- **Zdravoslav `/krevni-tlak/`**: long hub, H2 by form (tinktury vs kapsle), „jak vybrat“, cross-links to heart/vessels/minerals/teas, product grid.
- **Pilulka best-of hub**: „tichý zabiják“ narrative, lifestyle (sůl, pohyb), herb list, bestsellers.
- **ProfiDoplnky article**: educational depth — definition, mmHg values (120/80, 140/90), symptoms, causes, L-arginin/citrulin + hloh/česnek/ibišek.
- **Bylinkopedie**: herb encyclopedia (hloh, meduňka, česnek, olivový list, jmelí, kopřiva) + forms of use.
- **Pharmacy Q&A (BENU etc.)**: trust tone, konzultace s lékařem, olivový list / hloh / jmelí / česnek.

### Steal structure, never copy text

Must-have blocks competitors win with that we must out-execute:

1. Commercial H1/title = primary KW
2. Intro with primary KW in sentence 1 + assortment + disclaimer + shipping/COD
3. How-to-choose by goal + form + drug compatibility
4. **Values table** (normální / zvýšený / vysoký mmHg)
5. Forms comparison table
6. Ingredients / LSI table (broad: hloh, jmelí, česnek, olivový list, ibišek, Mg+K, arginin, CoQ10, omega-3)
7. Short „tichý zabiják“ / symptoms (not a medical textbook)
8. Dedicated režimová opatření H2 (sůl, pohyb, spánek, stres)
9. Strong safety callout (≠ antihypertenziva; urgent thresholds)
10. FAQ covering PAA + shipping

## Keyword map

- **Primary:** `doplňky stravy na krevní tlak`
- **Secondary:** `doplňky na vysoký krevní tlak`, `byliny na tlak`, `bylinné kapky na tlak`, `hloh na krevní tlak`, `přírodní prostředky na vysoký krevní tlak`, `hořčík a draslík na tlak`, `olivový list krevní tlak`, `hypertenze doplněk stravy`
- **PAA:** léky na předpis, jak dlouho, byliny místo léků, tonometr, hodnoty tlaku

## UX constraints (renderer)

Plain Czech text only (no HTML/Markdown). App builds: TOC, `<h2>`, `<p>`, `<ul>`, tables, safety `<aside>`, absolute internal links.

## Compliance

- Use „podpora / přispívá k / může podporovat“ — never „léčí / vyléčí / zaručeně sníží“.
- Doplněk stravy nenahrazuje předepsaná antihypertenziva.
- Deep medical guide → link path `/pruvodce/blood-pressure` (do not dump full medical TOC on hub).
- No competitor brand names. No fake ratings/reviews.

## Output JSON

```json
{
  "slug": "blood-pressure",
  "name": "Vysoký krevní tlak",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… primaryKeyword in sentence 1, ~80–120 words …",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat …", "body": "…", "bullets": ["…"] },
    { "id": "priznaky-a-hodnoty", "heading": "…", "body": "…" },
    { "id": "byliny-a-mineraly", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "rezim", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Orientační hodnoty krevního tlaku (mmHg)",
      "headers": ["Kategorie", "Systolický", "Diastolický", "Co dělat"],
      "rows": [["…", "…", "…", "…"]]
    },
    {
      "caption": "Formy produktů — rychlé srovnání",
      "headers": ["Forma", "Kdy zvolit", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Časté složky v doplňcích na krevní tlak",
      "headers": ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
      "rows": [["…", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Vysoký krevní tlak", "path": "/pruvodce/blood-pressure" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Křečové žíly", "path": "/category/varicose-veins" }
  ],
  "categoryFaq": [
    { "q": "…", "a": "…" }
  ],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na krevní tlak",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  }
}
```

Write original Czech. Beat competitors on clarity, tables, PAA coverage, and scannability — not on word count alone.
