# One-shot prompt — `/category/varicose-veins` only (Recenze Ceny, cs-CZ)

Do **not** reuse this for other categories. Source of truth = Czech SERP competitors for křečové žíly / péče o žíly (Pilulka, BENU, Magistra, media guides). Do **not** copy existing hub text from this site.

## Role

You are a Czech SEO specialist + UX writer for a commercial category hub about **přípravky na křečové žíly** (gely, krémy, doplňky stravy). Output must win commercial queries against pharmacy hubs while staying compliant (doplněk ≠ lék; gel nevyléčí varixy).

## Competitor strengths to beat (observed)

- **Pilulka `/krecove-zily`**: H1/title «Léky na křečové žíly a otoky nohou - cena již od…»; grid then SEO body — definice, efekty (seznam), příčiny, příznaky, léčba, životní styl; cross-link na doplňky; Q&A lékárníka.
- **BENU `/leky-na-krecove-zily`**: title se slevou; filtry dle látek (diosmin, heparin…); číslované tipy: masti → tablety → komprese → strava → cvičení.
- **Magistra / lékárenské katalogy**: široký sortiment, tenký educational text.
- **Media (euro.cz, biomag)**: komprese, byliny (jírovec, réva, listnatec), jasné „mast nevyléčí křečové žíly“.

### Steal structure, never copy text

Must-have blocks competitors win with that we must out-execute:

1. Commercial H1/title = primary KW `přípravky na křečové žíly` (never «léky» in H1/title — our assortment is supplements/gels on COD)
2. Intro: primary KW in sentence 1 + forms (gel/krém/kapsle) + disclaimer + shipping/COD ČR
3. H2 Pro koho / rizikové skupiny
4. H2 Jak vybrat — gel vs kapsle vs režim/komprese + bullets
5. H2 Příznaky těžkých nohou a počínajících varixů (lists, not textbook)
6. H2 Gely, masti a perorální přípravky (no OTC brand names)
7. H2 Režimová opatření (chůze, elevace, méně stání, komprese dle lékaře)
8. H2 Bezpečnost / kdy k lékaři (callout)
9. **Three tables:** forms comparison · common substances (diosmin, hesperidin, aescin/jírovec, rutin, vinná réva, gotu kola) · symptom → co zkusit (orientation, not diagnosis)
10. FAQ 6–8: gel vs tablety, délka kúry, otoky, venotonikum, komprese, shipping/COD
11. hubLinks: `/pruvodce/varicose-veins`, `/delivery`, `/medical-expert`, related `/category/hemorrhoids`

## Keyword map

- **Primary:** `přípravky na křečové žíly`
- **Secondary:** `gel na křečové žíly`, `mast na křečové žíly`, `doplňky stravy na žíly a cévy`, `těžké nohy`, `otoky nohou`, `venotonika`, `diosmin hesperidin`, `koňský kaštan`, `kompresní punčochy`, `jak na křečové žíly`, `platba na dobírku`, `doručení v České republice`
- **PAA:** gel nebo tablety, jak dlouho používat, doplňky na otoky nohou, co je venotonikum, komprese vs gel

## UX constraints (renderer)

Plain Czech text only (no HTML/Markdown). App builds: TOC, `<h2>`, `<p>`, `<ul>`, tables, safety `<aside>`, absolute internal links.

## Compliance

- Use „podpora / přispívá k / může podporovat“ — never „léčí / vyléčí / zaručený výsledek“.
- Doplněk stravy a gel nenahrazují diagnózu, kompresi ani zákrok.
- Mast/gel nevyléčí již vzniklé varixy — úleva od pocitu těžkých nohou, ne odstranění žil.
- Deep medical guide → `/pruvodce/varicose-veins`.
- No competitor OTC brand names. No fake ratings/reviews.

## Output JSON

```json
{
  "slug": "varicose-veins",
  "name": "Křečové žíly",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… primaryKeyword in sentence 1, ~80–120 words …",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat přípravky na křečové žíly", "body": "…", "bullets": ["…"] },
    { "id": "priznaky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "gely-a-doplnky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "rezim", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Formy péče o žíly — rychlé srovnání",
      "headers": ["Forma", "Kdy zvolit", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Časté látky v přípravcích na žíly a cévy",
      "headers": ["Složka", "Proč se objevuje v katalogu", "Upozornění"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Příznak → co zkusit (orientačně)",
      "headers": ["Situace", "Lokálně", "Vnitřně / režim"],
      "rows": [["…", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Křečové žíly", "path": "/pruvodce/varicose-veins" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Hemoroidy", "path": "/category/hemorrhoids" }
  ],
  "categoryFaq": [
    { "q": "…", "a": "…" }
  ],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "přípravky na křečové žíly",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  }
}
```

Write original Czech. Beat competitors on clarity, tables, PAA coverage, and scannability — not on word count alone.
