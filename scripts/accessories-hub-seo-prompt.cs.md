# Accessories hub SEO + UX prompt (Recenze Ceny CZ)

**Slug only:** `accessories` → `/category/accessories`  
**Do not** reuse pharmacy/supplement hub prompts or other category packs on this site.  
**Orient only on CZ fashion SERP competitors** (Zalando, Answear, Wowdoplnky) and beat them on selection depth, tables, FAQ schema, and COD clarity.

---

## Dual role

1. **Czech fashion SEO specialist** — win commercial queries around módní doplňky without copying competitor paragraphs.
2. **UX designer for a catalog hub** — scannable in ~10 seconds: TOC → who → how to choose → types → materials → size/exchange callout → FAQ.

Tone: practical style magazine + e-shop (cs-CZ). Calm, concrete, no slang spam. Genre: commercial category hub — not encyclopedia, not PDP, not medical.

---

## Competitor SERP brief (what to steal as patterns, never as copy)

| Source | Winning pattern |
|--------|-----------------|
| **Zalando** `dámské doplňky` | H1 = clear commercial KW; long bottom SEO with H2 on combining accessories + materials; strong subtype taxonomy (tašky, hodinky, brýle, opasky…) |
| **Answear** | Title pairs `dámské doplňky` + `módní doplňky`; 2 editorial H2 blocks (~500–600 chars each) on careful selection and occasion |
| **Wowdoplnky** | Niche H1 angle; short trust intro; return/COD signals in meta |

**Gaps we exploit:** competitors rarely ship comparison tables or FAQPage; thin “jak vybrat” depth; weak COD education. We ship tables + FAQ + dobírka/kurýr.

---

## Keyword map (must use)

- **Primary:** `módní doplňky` (title, H1, first sentence of intro)
- **Secondary / LSI:** `dámské doplňky`, `pánské doplňky`, `tašky`, `hodinky`, `sluneční brýle`, `opasky`, `módní doplňky online`, `platba na dobírku`
- **PAA / H2 angles:** jak vybrat módní doplňky; jak vybrat tašku; jak kombinovat doplňky; materiály a péče; výměna velikosti; doručení / dobírka

Assortment framing (aspirational shelf): **tašky, hodinky, sluneční brýle / brýle, opasky** (+ related everyday fashion accessories). Do not invent fake brand/product names or review counts.

---

## Meta / H1 rules

| Element | Rule |
|---------|------|
| Title lead | `Módní doplňky` then optional `od {price}` / geo, then `\| Recenze Ceny` — **≤60 chars** |
| H1 | Prefer `Módní doplňky` (same intent as title) |
| Meta description | Benefit + assortment types + dobírka CTA — **130–158 chars** |
| Schema content | FAQ answers plain text (feeds FAQPage). No AggregateRating. No medical entities. |

---

## UX structure (required)

1. Intro ~80–120 words — primary KW in sentence 1; mention types + ČR + dobírka.
2. H2 sections (ids stable):
   - `pro-koho` — who the shelf is for
   - `jak-vybrat` — how to choose (bullets)
   - `typy` — tašky / hodinky / brýle / opasky
   - `materialy` — materials & care
   - `velikosti` — sizes, exchange, returns (**fashion callout**, NOT “kdy k lékaři”)
3. **Two hubTables:**
   - Typ × příležitost × na co se dívat
   - Materiál × péče × kdy zvolit
4. **hubLinks (clickable internal only)** — no medical-expert:
   - `/pruvodce/accessories`
   - `/delivery`
5. FAQ 7–8 pairs: selection + size/exchange + shipping/COD. No “číslo šarže”, no “doplněk stravy”, no doctor language.

Hard bans: competitor brand names in body; medical/YMYL; supplement claims; copied Zalando/Answear sentences.

---

## Output JSON schema

```json
{
  "slug": "accessories",
  "name": "Doplňky",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… (módní doplňky in sentence 1)",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat módní doplňky", "body": "…", "bullets": ["…"] },
    { "id": "typy", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "materialy", "heading": "…", "body": "…" },
    { "id": "velikosti", "heading": "Velikosti, materiály a výměna", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Typy módních doplňků — rychlé srovnání",
      "headers": ["Typ", "Kdy zvolit", "Na co se dívat"],
      "rows": [["Tašky", "…", "…"]]
    },
    {
      "caption": "Materiály a péče",
      "headers": ["Materiál", "Péče", "Kdy zvolit"],
      "rows": [["Kůže / imitace", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Doplňky", "path": "/pruvodce/accessories" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["módní doplňky", "tášky", "hodinky", "sluneční brýle", "opasky", "platba na dobírku"],
  "seoIntent": {
    "primaryKeyword": "módní doplňky",
    "secondaryKeywords": ["dámské doplňky", "pánské doplňky", "tašky", "hodinky", "sluneční brýle", "opasky", "módní doplňky online", "platba na dobírku"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Módní doplňky — od … Kč | Recenze Ceny",
    "h1Example": "Módní doplňky",
    "descriptionAngle": "types + benefit + dobírka CTA"
  }
}
```

Return **only valid JSON**. Czech orthography. No markdown fences around the JSON.
