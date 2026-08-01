# One-shot prompt — `/category/detox-cleanse` hub SEO (Recenze Ceny)

**Scope:** only this category (`detox-cleanse` / Detoxikace a čištění).  
**Do not** reuse wording, section templates, or keyword lists from other site hubs.  
**Do not** rewrite, polish, expand, or paraphrase any existing Recenze Ceny hub/thin pack text for this slug — treat the old page as if it does not exist.  
**Invent** a fresh hub from CZ SERP competitor patterns below (Enori organ-first, Magistra/LékárnaProRadost goal taxonomy, BrainMarket ingredient education, Lékárna „jak detoxikovat“).

**Hard ban on our old openers / frames:** never start with «Hledáte…», «Katalog je určen…», «Nejdřív si ujasněte cíl…», or other phrases copied from prior `detox-cleanse` pack. New angles only (e.g. organs work 24/7 → choose goal → forms).

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for slug `detox-cleanse`.

---

## Dual role

1. **Czech SEO specialist** — beat pharmacy category hubs (Lékárna.cz, Magistra, BENU, BrainMarket, Enori, LékárnaProRadost) on usefulness and commercial intent coverage for detox queries.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC anchors → how-to-choose → goal taxonomy → ingredients → forms → regime tips → safety callout → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP brief (patterns to steal — never copy paragraphs or brand names)

Observed winners for queries like `doplňky stravy na detoxikaci`, `detoxikace organismu`, `očista organismu`, `detox těla`, `jaterní očista`, `odvodnění organismu`:

| Pattern | What tops do | How we win |
|---------|--------------|------------|
| H1 / title | Commercial or category phrase first (`Detoxikace organismu…` / `Doplňky stravy…`) | `primaryKeyword` = `doplňky stravy na detoxikaci`; H1 aligns; weave `…detoxikaci organismu` in intro |
| Goal taxonomy | Játra / střeva / odvodnění / zelené potraviny / čaje-kúry | Dedicated H2 `cile` + comparison table |
| Ingredients | Ostropestřec/silymarin, artyčok, chlorella, spirulina, kopřiva, pampeliška, vláknina | H2 `slozky` + second table — education, not medical dosing |
| «Jak detoxikovat» | Soft lifestyle: not starvation/juice drama; support organs + hydration | H2 `rezim` with short numbered tips |
| Seasonal cue | Jaro / po svátcích as context | One natural sentence in intro or `pro-koho` — no clickbait |
| Compliance | DS ≠ lék; pregnancy, meds, chronic disease → doctor | Strong `bezpecnost` + FAQ |
| COD / CZ delivery | Trust signals | Intro + FAQ |
| How to choose | Checklist: cíl, forma, dávka, délka kúry, cena za den | H2 `jak-vybrat` with bullets |

**Forbidden:** competitor brand/SKU names (GS, LEROS, Dr.Popov, MOVit, NatureVia, VENIRA, …); «léčí / vyléčí / zaručený výsledek / nejrychlejší detox»; fake AggregateRating; invented product rows; gel/krém form rows (irrelevant to this hub).

**Allowed claims style:** «podpora / přispívá k / může pomoci» — doplněk stravy, nikoli lék; tělo detoxikuje játry, ledvinami a střevy přirozeně.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy na detoxikaci`
- **secondaryKeywords:** doplňky stravy na detoxikaci organismu, detoxikace organismu, očista organismu, detox těla, jaterní očista, detoxikace jater, očista střev, odvodnění organismu, bylinná detox kúra, ostropestřec, silymarin, chlorella, spirulina, artyčok, pampeliška, kopřiva, zelené potraviny, vláknina, platba na dobírku, doručení Česká republika
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 80–120 words; primary KW in sentence 1; mention natural organ support (játra/ledviny/střeva); soft seasonal cue optional; dobírka + 2–5 dnů + ČR; DS ≠ lék / ne agresivní kúra.
2. Sections (ids mandatory):
   - `pro-koho` — audience (po svátcích, jarní režim, podpora trávení/energie) + who sees a doctor first
   - `jak-vybrat` — checklist bullets (cíl → typ → etiketa mg/dávka → délka kúry → cena za den → hydratace)
   - `cile` — játra vs střeva vs odvodnění vs zelené potraviny (decision map)
   - `slozky` — ostropestřec/silymarin, artyčok, chlorella/spirulina, vláknina, byliny na odvodnění
   - `formy` — kapsle/tablety, čaj/bylinná kúra, prášek/zelené potraviny (**no gel/krém**)
   - `rezim` — short numbered tips (pití, cyklus+pauza, ne hladovění/agresivní projímadla)
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Cíl / typ podpory: Játra | Střeva | Odvodnění | Zelené potraviny × kdy zvolit × na co se dívat
   - Formy: Kapsle/tablety | Čaj/kúra | Prášek/zelené potraviny × kdy zvolit × na co se dívat
   - Optional 3rd: Látka × k čemu se vztahuje × tip při výběru
4. `hubLinks` (paths absolute site-relative):
   - `/pruvodce/detox-cleanse`
   - `/delivery`
   - `/medical-expert`
   - `/category/digestive`
   - `/category/liver-health`
5. FAQ 6–8 topic pairs + doprava/dobírka/originalita (plain text for FAQPage).
6. `tagline` + `shortDesc` for hero/meta helpers.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Compliance (hard)

- Use: „podpora / přispívá k / přirozené očistné procesy“.
- Never: „léčí / vyléčí / zaručený výsledek / odstraňuje všechny toxiny / nejrychlejší detox“.
- No competitor brand names, no fake AggregateRating, no invented product SKUs.
- Anti-cannibalization: hub = selection + how to choose + tables + CTA; deep medical TOC → `/pruvodce/detox-cleanse`.

---

## Output JSON schema

```json
{
  "slug": "detox-cleanse",
  "name": "Detoxikace a čištění",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… (primaryKeyword in sentence 1)",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat doplňky stravy na detoxikaci", "body": "…", "bullets": ["…"] },
    { "id": "cile", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "slozky", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "formy", "heading": "…", "body": "…" },
    { "id": "rezim", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Cíl očisty — rychlé srovnání",
      "headers": ["Cíl", "Kdy zvolit", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Formy doplňků na detoxikaci — rychlé srovnání",
      "headers": ["Forma", "Kdy zvolit", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Detoxikace a čištění", "path": "/pruvodce/detox-cleanse" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Trávení", "path": "/category/digestive" },
    { "label": "Kategorie: Játra", "path": "/category/liver-health" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["doplňky stravy na detoxikaci", "…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na detoxikaci",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na detoxikaci | Recenze Ceny",
    "h1Example": "Doplňky stravy na detoxikaci",
    "descriptionAngle": "benefit + assortment + dobírka"
  }
}
```

Return **only** valid JSON (no markdown fences).
