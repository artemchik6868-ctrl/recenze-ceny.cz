# One-shot prompt — `/category/anti-aging` hub SEO (Recenze Ceny)

**Scope:** only this category. Do **not** reuse copy, section templates, or keyword lists from other site hubs (klouby, potence, hubnutí, …). Do **not** rewrite or polish the current thin page text — invent a fresh hub from CZ SERP competitor patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for slug `anti-aging`.

**Catalog reality:** shelf is **cream-heavy** (anti-aging krémy). Education may cover oral kolagen/HA (what CZ SERP teaches), but must be honest that local assortment leans lokální péče.

---

## Dual role

1. **Czech SEO specialist** — beat pharmacy hubs, brand category pages (Venira-style «proti stárnutí»), Pilulka kolagen/longevity PDPs, and «krém + doplněk» bundle pages on usefulness + commercial intent.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → Jak vybrat → dual vnitřní/lokální → ingredient tables → safety → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP brief (patterns to steal — never copy paragraphs or brand names)

Observed winners for queries like `doplňky stravy anti-aging`, `doplňky stravy proti stárnutí`, `kolagen na pleť`, `kyselina hyaluronová doplněk`, `anti-aging krém`, `krása zevnitř`:

| Pattern | What tops do | How we win |
|---------|--------------|------------|
| H1 / title | Commercial phrase first (`Doplňky stravy…` / `Kolagen na pleť…`) | `primaryKeyword` = `doplňky stravy anti-aging`; H1 aligns |
| Dual care | Brand pages push **kapsle + kosmetická řada** (zevnitř + zvenčí) | Dedicated H2 vnitřní vs lokální; honesty that catalog is cream-heavy |
| Collagen education | Hydrolyzovaný kolagen, orientační 2,5–10 g/den, typy I/III | H2 složky + table with «dle etikety» |
| HA + vitamin C | HA hydratace; C přispívá k normální tvorbě kolagenu (EFSA-safe) | Table + FAQ — no miracle % claims |
| Timeline | Changes in weeks–months, not overnight | H2 «Co očekávat od kúry» |
| SPF / režim | Lifestyle beats «zázračný krém» alone | Checklist + FAQ «Stačí krém bez SPF?» |
| Longevity PDPs | NMN / Urolithin / polyfenoly on pharmacies | Mention antioxidanty lightly; do **not** invent NMN SKUs we don't sell |
| Comparison tables | Formy + dávky + cíl | ≥2 (ideálně 3) hubTables |
| COD trust | Missing on many brand landings | Intro + FAQ: dobírka, 2–5 dnů, ČR |

**Forbidden:** competitor brand names (Venira, Pilulka, Solgar, Clinical, Vital Proteins, Carnium, Booslabs, Mandimu, …); «léčí / vyléčí / věčné mládí / zaručený výsledek»; fake AggregateRating; inventing product SKUs; % claims like «o 89 % pevnější pleť».

**Allowed claims style:** «podpora / přispívá k / může pomoci» — doplněk stravy nebo topický přípravek, nikoli lék, filler ani estetický zákrok.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy anti-aging`
- **secondaryKeywords:** doplňky stravy proti stárnutí, anti-aging krém, krém proti stárnutí, krém proti vráskám, kolagen na pleť, kyselina hyaluronová, hydrolyzovaný kolagen, krása zevnitř, koenzym Q10, vitamin C na pleť, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 80–120 words; primary KW in sentence 1; cream-heavy honesty; dobírka + 2–5 dnů + ČR; DS/topikum ≠ lék.
2. Sections (ids mandatory):
   - `pro-koho` — 30+/40+/zralá pleť, muži i ženy; akutní dermatóza → lékař
   - `jak-vybrat` — checklist: cíl, forma, složení, cena, SPF
   - `vnitrni-vs-lokalni` — krém vs kapsle/drink; catalog = lokální-heavy
   - `slozky` — kolagen, HA, vitamin C, E/Q10, antioxidanty (education, orientační dávky = literature orientation)
   - `co-ocekavat` — timeline týdny–měsíce
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2 (prefer 3):
   - Formy: Krém | Kapsle/tablety | Drink/prášek × kdy zvolit × na co se dívat
   - Látky + orientační dávky (vždy dle etikety)
   - Cíl uživatele × doporučená forma
4. `hubLinks` (paths absolute site-relative):
   - `/pruvodce/anti-aging`
   - `/delivery`
   - `/medical-expert`
   - `/category/hair-care`
5. FAQ 6–8 pairs: topic PAA (účinek, SPF, krém vs kolagen zevnitř, délka kúry, DS ≠ lék, dermatolog) + doprava/dobírka/originalita.
6. `tagline` + `shortDesc` for hero/meta helpers.
7. `keywords` array for internal KW list.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "anti-aging",
  "name": "Anti-aging",
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
    { "label": "…", "path": "/pruvodce/anti-aging" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy anti-aging",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy anti-aging — od … Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy anti-aging",
    "descriptionAngle": "benefit + cream/oral honesty + dobírka"
  }
}
```

Return **only** valid JSON (no markdown fence commentary outside the object).
