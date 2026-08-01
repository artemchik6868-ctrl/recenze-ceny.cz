# One-shot prompt — `/category/cystitis` hub SEO (Recenze Ceny)

**Scope:** only this category (cystitis / močové cesty). Do **not** reuse copy, section templates, or keyword lists from other site hubs. Do **not** rewrite or polish the current thin page text — invent a fresh hub from CZ SERP competitor patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for slug `cystitis`.

---

## Dual role

1. **Czech SEO specialist** — beat pharmacy category hubs (BENU močové cesty, Dr.Max / Onlinelekarna uro PDPs) and educational articles (Element brusinka, Ordinace D-manóza+brusinky, Alfafit UTI tips, medical reviews) on usefulness and commercial intent coverage.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC anchors → akut vs prevence → how-to-choose → ingredients → forms → regime → comparison tables → safety callout → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP brief (patterns to steal — never copy paragraphs or brand names)

Observed winners for queries like `doplňky stravy na cystitidu`, `zánět močového měchýře`, `brusinky na cystitidu`, `D-manóza`, `doplňky na močové cesty`, `přírodní léčba cystitidy`:

| Pattern | What tops do | How we win |
|---------|--------------|------------|
| H1 / title | Commercial phrase first (`Doplňky…` / močové cesty) | `primaryKeyword` = `doplňky stravy na cystitidu`; H1 aligns |
| TOC | Long articles use numbered H2 / «Obsah» | App builds TOC from H2 ids — clear section ids |
| Acute vs prevention | Rankings split akutní potíže vs recidivy / prevence | Dedicated H2 `akutni-vs-prevence` + comparison table |
| Ingredients | D-manóza (FimH / adheze E. coli), brusinky PAC-A, vitamin C, probiotika, zlatobýl / lichořeřišnice | H2 `slozky` education without competitor brand names |
| PAC / dose literacy | Tops mention PAC mg, extract quality vs juice | Checklist in «Jak vybrat» — look for PAC / mg on label |
| Forms | Tablety, sáčky/prášek, sirup — not gels | Table: kapsle/tablety \| sáčky \| sirup |
| Regime | Pitný režim, močení po styku, hygiena | Dedicated H2 `rezim` with bullets |
| DS ≠ antibiotics | Explicit: akutní infekce = lékař; DS = podpora | Strong safety callout + FAQ |
| COD / CZ shipping | Trust for online purchase | Intro + FAQ market cues |
| How to choose | Forma, cíl (akut/prevence), složení, pitný režim | H2 «Jak vybrat…» with bullets |

**Forbidden:** competitor brand names (Urinal, Uroval, Blokurima, PhytoCran, Cystivit, Cystonette, NatureVia, GS Brusinky, ADVANCE Urixin, Recyflor, …); «léčí / vyléčí / zaručený výsledek / nahradí antibiotika»; fake AggregateRating; inventing product SKUs or clinical cure rates.

**Allowed claims style:** «podpora / přispívá k / může pomoci / pomáhá vyplavovat v rámci doplňku» — doplněk stravy, nikoli lék ani antibiotikum. Evidence may be mixed — stay humble.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy na cystitidu`
- **secondaryKeywords:** zánět močového měchýře, zánět močových cest, infekce močových cest, doplňky na močové cesty, přípravky na močové cesty, brusinky na cystitidu, brusinky močové cesty, D-manóza, D-manosa, PAC, proanthokyanidiny, recidivující cystitida, prevence zánětu močových cest, pálení při močení, časté močení, přírodní podpora močových cest, platba na dobírku, doručení Česká republika
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 80–120 words; primary KW in sentence 1; dobírka + 2–5 dnů + ČR; DS ≠ antibiotikum / akutní infekce = lékař.
2. Sections (ids mandatory):
   - `pro-koho` — women/adults with recurrent discomfort; red flags (horečka, krev v moči, bolest v bedrech)
   - `akutni-vs-prevence` — akutní diskomfort vs prevence recidiv (not medical treatment protocol)
   - `jak-vybrat` — checklist: cíl, PAC/mg na etiketě, D-manóza, forma, pitný režim, cena kúry
   - `slozky` — D-manóza, brusinky (PAC), vitamin C, probiotika, zlatobýl / lichořeřišnice (education only)
   - `formy` — kapsle/tablety, sáčky/prášek, sirup
   - `rezim` — pitný režim, hygiena, močení po styku, kdy nečekat na doplněk
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Forms: Kapsle/tablety | Sáčky/prášek | Sirup × kdy zvolit × na co se dívat
   - Cíl: Akutní podpora komfortu | Prevence recidiv × kdy zvolit × na co se dívat
4. `hubLinks` (site-relative paths):
   - `/pruvodce/cystitis`
   - `/delivery`
   - `/medical-expert`
   - `/category/kidney-health`
5. FAQ 6–8 pairs: topic PAA (akut vs lékař/ATB, D-manóza vs brusinky, délka kúry, těhotenství→lékař, forma, PAC) + doprava/dobírka/originalita.
6. `tagline` + `shortDesc` for hero/meta helpers.
7. `keywords` array for internal KW list.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "cystitis",
  "name": "Cystitida",
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
    { "label": "…", "path": "/pruvodce/cystitis" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na cystitidu",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na cystitidu — od … Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy na cystitidu",
    "descriptionAngle": "benefit + assortment + dobírka"
  }
}
```

Return **only** valid JSON (no markdown fence commentary outside the object).
