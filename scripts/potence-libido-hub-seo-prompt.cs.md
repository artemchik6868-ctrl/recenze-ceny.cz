# One-shot prompt — `/category/potence-libido` hub SEO (Recenze Ceny)

**Scope:** only this category. Do **not** reuse copy, section templates, or keyword lists from other site hubs (klouby, hubnutí, tlak, …). Do **not** rewrite or polish the current thin page text — invent a fresh hub from CZ SERP competitor patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for slug `potence-libido`.

---

## Dual role

1. **Czech SEO specialist** — beat pharmacy category hubs + affiliate ranking pages on usefulness and commercial intent coverage.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC anchors → how-to-choose → comparison tables → safety callout → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP brief (patterns to steal — never copy paragraphs or brand names)

Observed winners for queries like `doplňky stravy na potenci`, `prášky na erekci bez předpisu`, `kapsle na potenci`, `přípravky na potenci`:

| Pattern | What tops do | How we win |
|---------|--------------|------------|
| H1 / title | Commercial phrase first (`Doplňky…` / `Prášky na erekci…`) | `primaryKeyword` = `doplňky stravy na potenci`; H1 aligns |
| TOC | Affiliate pages use «Obsah článku» | App builds TOC from H2 ids — provide clear section ids |
| Acute vs course | Rankings split «před sexem» vs «dlouhodobá kúra» | Dedicated H2 + comparison table |
| Ingredients | Tribulus / maca / ženšen / L-arginin / zinek education | H2 on složky without competitor brand names |
| Comparison tables | Onset, composition, price/performance | ≥2 tables: forms + typ podpory |
| DS ≠ Rx | Explicit: sildenafil/tadalafil = prescription; DS = support only | Strong safety callout + FAQ |
| COD / discrete | Shipping trust for intimate category | FAQ + intro market cues |
| How to choose | Checklist: forma, dávka, cena za den, interakce | H2 «Jak vybrat…» with bullets |

**Forbidden:** competitor brand names (Proerecta, Vimax, Zerex, Clavin, ArginMax, …); «léčí / vyléčí / zaručený výsledek»; fake AggregateRating; inventing product SKUs.

**Allowed claims style:** «podpora / přispívá k / může pomoci» — doplněk stravy, nikoli lék na erektilní dysfunkci.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy na potenci`
- **secondaryKeywords:** prášky na erekci, prášky na erekci bez předpisu, tablety na erekci, kapsle na potenci, přípravky na potenci, prostředky na potenci, doplňky stravy pro erekci, libido, kotvičník zemní, L-arginin, maca, ženšen, zinek, platba na dobírku, diskrétní doručení
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 80–120 words; primary KW in sentence 1; dobírka + 2–5 dnů + ČR; DS ≠ lék.
2. Sections (ids mandatory):
   - `pro-koho` — audience + when to see a doctor
   - `jak-vybrat` — checklist bullets (forma, délka kúry, cena za den, léky na tlak/srdce)
   - `narazove-vs-kura` — acute before intimacy vs multi-week course
   - `slozky` — L-arginin, kotvičník (tribulus), maca, ženšen, zinek (education, not dosing medical advice)
   - `formy` — kapsle / kapky / gel
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Forms: Kapsle | Kapky | Gel × kdy zvolit × na co se dívat
   - Typ podpory: Nárazová / Dlouhodobá kúra × kdy zvolit × na co se dívat
4. `hubLinks` (paths absolute site-relative):
   - `/pruvodce/potence-libido`
   - `/delivery`
   - `/medical-expert`
   - `/category/prostate-health`
5. FAQ 6–8 pairs: topic PAA (akutní vs kúra, DS vs předpis, interakce s tlakem, délka kúry, forma) + doprava/dobírka/originalita.
6. `tagline` + `shortDesc` for hero/meta helpers.
7. `keywords` array for internal KW list.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "potence-libido",
  "name": "Potence a libido",
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
    { "label": "…", "path": "/pruvodce/potence-libido" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na potenci",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na potenci — od … Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy na potenci",
    "descriptionAngle": "benefit + assortment + dobírka"
  }
}
```

Return **only** valid JSON (no markdown fence commentary outside the object).
