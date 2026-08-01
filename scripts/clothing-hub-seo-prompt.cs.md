# Clothing hub SEO + UX prompt (Recenze Ceny CZ)

**Slug only:** `clothing` → `/category/clothing`  
**Do not** reuse pharmacy/supplement hub prompts, accessories packs, or other category packs on this site.  
**Orient only on CZ fashion SERP competitors** (Zalando, ABOUT YOU, Answear + occasion-driven dress shops for depth) and beat them on selection depth, tables, FAQ schema, and COD clarity.

---

## Dual role

1. **Czech fashion SEO specialist** — win commercial queries around dámské / pánské / oblečení online without copying competitor paragraphs.
2. **UX designer for a catalog hub** — scannable in ~10 seconds: TOC → occasions → how to choose → types → materials → size/exchange callout → FAQ.

Tone: practical style magazine + e-shop (cs-CZ). Calm, concrete, no slang spam. Genre: commercial category hub — not encyclopedia, not PDP, not medical.

---

## Competitor SERP brief (what to steal as patterns, never as copy)

| Source | Winning pattern |
|--------|-----------------|
| **Zalando** `dámské oblečení` | H1 = clear commercial KW; subtype taxonomy chips (šaty, trička, kalhoty, džíny…); bottom SEO with H2 on style, outfits, colours, materials |
| **ABOUT YOU** | Title pairs trends + `dámské oblečení`; long editorial on body/cut/season; meta trust (doručení, vrácení, **dobírka**) |
| **Answear** | Gender hubs + deep type navigation |
| **Occasion shops** (večerní / svatební šaty) | Size tables, material notes, příležitost framing, return clarity |

**Gaps we exploit:** competitors rarely ship comparison tables or FAQPage on the hub; thin COD education; weak scannable “jak vybrat” checklist. We ship tables + FAQ + dobírka/kurýr + TOC.

---

## Keyword map (must use)

- **Primary:** `dámské oblečení` (title, H1, first sentence of intro)
- **Secondary / LSI:** `pánské oblečení`, `oblečení online`, `šaty`, `trička`, `kalhoty`, `džíny`, `mikiny`, `bundy`, `platba na dobírku`
- **PAA / H2 angles:** jak vybrat oblečení; materiál a střih; velikost a výměna; typy podle příležitosti; doručení / dobírka

Assortment framing (aspirational shelf): **šaty, trička/topy, kalhoty/džíny, mikiny/svetry, bundy/kabáty** (+ related everyday fashion). Cover dámské i pánské angles. Do not invent fake brand/product names or review counts.

---

## Meta / H1 rules

| Element | Rule |
|---------|------|
| Title lead | `Dámské oblečení` then optional `od {price}` / geo, then `\| Recenze Ceny` — **≤60 chars** |
| H1 | Prefer `Dámské oblečení` (same intent as title) |
| Meta description | Benefit + assortment types + dobírka CTA — **130–158 chars** |
| Schema content | FAQ answers plain text (feeds FAQPage). No AggregateRating. No medical entities. |

---

## UX structure (required)

1. Intro ~80–120 words — primary KW in sentence 1; mention types + ČR + dobírka.
2. H2 sections (ids stable):
   - `prilezitosti` — work / leisure / evening / sport
   - `jak-vybrat` — how to choose (bullets: střih, materiál, barva, velikost)
   - `typy` — šaty / trička / kalhoty-džíny / mikiny / bundy
   - `materialy` — materials & care
   - `velikosti` — sizes, exchange, returns (**fashion callout**, NOT “kdy k lékaři”)
3. **Two hubTables:**
   - Typ × příležitost × na co se dívat
   - Materiál × péče × kdy zvolit
4. **hubLinks (clickable internal only)** — no medical-expert:
   - `/pruvodce/clothing`
   - `/delivery`
5. FAQ 7–8 pairs: selection + size/exchange + materials + shipping/COD. No “číslo šarže”, no “doplněk stravy”, no doctor language.

Hard bans: competitor brand names in body; medical/YMYL; supplement claims; copied Zalando/ABOUT YOU/Answear sentences.

---

## Output JSON schema

```json
{
  "slug": "clothing",
  "name": "Oblečení",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… (dámské oblečení in sentence 1)",
  "categorySections": [
    { "id": "prilezitosti", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat oblečení", "body": "…", "bullets": ["…"] },
    { "id": "typy", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "materialy", "heading": "…", "body": "…" },
    { "id": "velikosti", "heading": "Velikosti, materiály a výměna", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Typy oblečení — rychlé srovnání",
      "headers": ["Typ", "Kdy zvolit", "Na co se dívat"],
      "rows": [["Šaty", "…", "…"]]
    },
    {
      "caption": "Materiály a péče",
      "headers": ["Materiál", "Péče", "Kdy zvolit"],
      "rows": [["Bavlna", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Oblečení", "path": "/pruvodce/clothing" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["dámské oblečení", "pánské oblečení", "oblečení online", "šaty", "trička", "kalhoty", "džíny", "mikiny", "bundy", "platba na dobírku"],
  "seoIntent": {
    "primaryKeyword": "dámské oblečení",
    "secondaryKeywords": ["pánské oblečení", "oblečení online", "šaty", "trička", "kalhoty", "džíny", "mikiny", "bundy", "platba na dobírku"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Dámské oblečení — od … Kč | Recenze Ceny",
    "h1Example": "Dámské oblečení",
    "descriptionAngle": "types + benefit + dobírka CTA"
  }
}
```

Return **only valid JSON**. Czech orthography. No markdown fences around the JSON.
