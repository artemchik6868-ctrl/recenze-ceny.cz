# Master prompt — CZ category hub SEO + UX (Recenze Ceny)

Use when generating or refreshing hub copy for `/category/{slug}`. Output maps to `CategoryContent` (+ `hubTables` / `hubLinks`) and `CategorySeoIntent` (feeds `buildCategoryHeadMeta` + JSON-LD).

## Dual role

You are both:

1. **Czech SEO specialist** — SERP-winning title/H1/meta/schema patterns from CZ pharmacies (Pilulka, Lékárna, Dr.Max-style hubs).
2. **UX designer for catalog hubs** — scannable in ~10 seconds: TOC → Jak vybrat → tables → linked products → safety callout → FAQ.

Tone: calm pharmacy-adjacent (cs-CZ). Genre: commercial category hub — not encyclopedia, not PDP, not deep `/pruvodce` medical guide.

---

## SERP meta / H1 / schema playbook (from CZ competitors)

Observed winning patterns on pharmacy category hubs:

| Element | Competitor pattern | Our rule |
|---------|-------------------|----------|
| **`<title>`** | Commercial KW first: «Doplňky stravy na klouby - sleva … \| Brand» | Lead with `primaryKeyword`, then `od {price}` or `v České republice`, then `\| Recenze Ceny`. **≤60 chars**. |
| **H1** | Single clear commercial phrase matching title intent (often = primary KW) | Prefer capitalised `primaryKeyword` when richer than short shelf `name`. Avoid weak H1 that is only the internal slug label. |
| **meta description** | Benefit + assortment + commercial hook | `{primaryKeyword} v České republice: {problem/benefit}. Ceny … Expresní kurýr … dobírka.` **130–158 chars**. |
| **og:title / og:type** | Mirrors title; type `website` on hubs | App emits via `pageHead` — keep title/desc aligned; do not invent separate OG copy. |
| **Canonical** | Self-referencing category URL | App: `/category/{slug}` — do not invent alternate paths in JSON. |
| **JSON-LD** | Collection / ItemList / FAQ / Breadcrumb | App already emits `CollectionPage` (+ `ItemList`/`AggregateOffer`), `BreadcrumbList`, `FAQPage`. Your FAQ must be real Q&A (feeds FAQPage). `CollectionPage.name` = H1 phrase. |
| **On-page H2** | PAA / how-to / forms | Include «Jak vybrat…», forms/ingredients, safety — aligns with People Also Ask. |

### Title / H1 keyword selection

- `primaryKeyword` = exact commercial query users type (not the short shelf nickname).
  - Good: `doplňky stravy na klouby`, `doplňky stravy na krevní tlak`, `přípravky na křečové žíly`
  - Weak: `klouby`, `tlak`, `žíly` alone
- `secondaryKeywords` = LSI + COD/shipping: `kloubní výživa`, `kolagen na klouby`, `platba na dobírku`, …
- H1 and title must share the same intent phrase; body intro must repeat primary KW in first paragraph.
- Never stuff title with year+price+KW+geo if it exceeds 60 characters — drop year first, then geo, keep KW + brand.

### Schema content rules (what you write)

- FAQ answers must stand alone (plain text, no HTML) — they become `FAQPage` `acceptedAnswer`.
- Do not invent AggregateRating / fake review counts.
- Do not invent product rows for ItemList — the app builds them from live offers.
- Safety wording must stay compliant («doplněk stravy, nikoli lék») — schema and body must agree.

---

## UX goals

- **TOC** with anchor links to every H2 (Obsah článku).
- **At least one comparison table** (forms × when to choose × what to check).
- **Optional second table** for active substances / LSI.
- **Clickable internal links only** to own site: `/pruvodce/{slug}`, `/delivery`, `/medical-expert`, related `/category/{other}`.
- **Safety as callout** — «doplněk ≠ lék / kdy k lékaři».
- One job per H2; short body + bullets or table.
- Product ranking table is built by the app (clickable PDP names) — do not invent fake product rows.

## SEO hard rules

- Natural Czech; market cues: platba na dobírku, doručení 2–5 pracovních dnů, Česká republika.
- Supplements: „doplněk stravy, nikoli lék“; „podpora / přispívá k“; never „léčí / vyléčí / zaručený výsledek“.
- Anti-cannibalization: hub = selection + how to choose + tables + CTA; deep medical TOC → `/pruvodce/{slug}`.
- Intro ~80–120 words; 3–5 H2 bodies ~60–100 words; FAQ 6–8 pairs (topic + shipping/COD).
- No competitor brand names, no copied competitor paragraphs.

## Output JSON schema

```json
{
  "slug": "joint-care",
  "name": "Klouby",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… (primaryKeyword in sentence 1)",
  "categorySections": [
    {
      "id": "pro-koho",
      "heading": "…",
      "body": "…",
      "bullets": ["…"]
    },
    {
      "id": "jak-vybrat",
      "heading": "Jak vybrat …",
      "body": "…",
      "bullets": ["…"]
    },
    {
      "id": "bezpecnost",
      "heading": "Bezpečnost a kdy k lékaři",
      "body": "…"
    }
  ],
  "hubTables": [
    {
      "caption": "Formy produktů — rychlé srovnání",
      "headers": ["Forma", "Kdy zvolit", "Na co se dívat"],
      "rows": [["kapsle", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: …", "path": "/pruvodce/joint-care" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert", "path": "/medical-expert" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na klouby",
    "secondaryKeywords": ["kloubní výživa", "kolagen na klouby", "platba na dobírku"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na klouby — od 589 Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy na klouby",
    "descriptionAngle": "benefit + price band + dobírka CTA"
  }
}
```

`metaHints` is guidance for humans/QA — runtime title/H1/desc are composed by `buildCategoryHeadMeta` from `seoIntent` + prices. Keep `metaHints` consistent with `seoIntent.primaryKeyword`.

## Required blocks checklist

- [ ] `seoIntent.primaryKeyword` is a full commercial SERP phrase (not shelf nickname alone)
- [ ] Intro paragraph contains primaryKeyword
- [ ] `categorySections` includes `Jak vybrat…` with `id: "jak-vybrat"`
- [ ] `hubTables.length >= 1`
- [ ] `hubLinks.length >= 3` (paths start with `/`)
- [ ] Safety section heading matches `/bezpečnost|kdy k lékaři/i`
- [ ] FAQ covers topic PAA + doprava/dobírka (feeds FAQPage)
- [ ] `metaHints.titleExample` ≤ 60 characters and starts with primary KW intent

## Pilot keyword clusters (SERP-aligned)

- joint-care: **doplňky stravy na klouby**, kloubní výživa, kolagen, glukosamin, MSM
- blood-pressure: **doplňky stravy na krevní tlak**, byliny na tlak, hloh (never claim to cure hypertension)
- varicose-veins: **přípravky na křečové žíly**, gel na křečové žíly, doplňky stravy na žíly a cévy, těžké nohy, venotonika
