# One-shot prompt — `/category/parasites` hub SEO (Recenze Ceny)

**Scope:** only slug `parasites` (`https://recenze-ceny.cz/category/parasites`). Do **not** reuse copy, section templates, or keyword lists from other site hubs. Do **not** polish or extend the current thin page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for `parasites`.

---

## Dual role

1. **Czech SEO specialist** — beat pharmacy indication hubs, herbal PDPs, and educational articles on usefulness + commercial intent for adult antiparasitic **doplňky stravy**.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → DS vs Rx → byliny → forms/tables → safety → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `doplňky stravy na parazity`, `přípravky proti parazitům`, `antiparazitární kúra byliny`, `jak se zbavit střevních parazitů doplněk stravy`, `prostředek proti parazitům`.

| Competitor type | Examples (patterns only) | Blocks / volume | Meta / schema signals | Tone |
|-----------------|--------------------------|-----------------|----------------------|------|
| Indication / category hub | GigaLékárna «Paraziti» under trávení | Short intro (~80–150 words) + product grid; stress **kapsle / sirupy / kapky**; stock + shipping trust | E-com category listing | Practical, shop-first |
| Pharmacy PDP | Herbal antiparasitic capsules on Vitalmix / GigaLékárna / ZdravýNákup | H1 brand; **mg composition table**; dávkování; disclaimer «doplněk ≠ lék»; related products | Product + Breadcrumb | Label-led, cautious claims |
| Educational article | Lékárna.cz odčervení lidí; Pilulka on roupy / bez předpisu; Bylik byliny FAQ | Long H2 chain: příznaky → **lékař / anthelmintika na předpis** → byliny → strava/vláknina → kdy k lékaři; 800–2000+ words | Article / FAQ | Calm, medical-adjacent |
| Affiliate long-copy | Detoxicin / Cleorix-style landings | Účinky / složení / cena / kde koupit v ČR; benefit bullets | Often weak schema; aggressive claims risk | Salesy — **do not copy claim style** |

### Winning patterns to absorb

1. Explicit split: **léky na předpis (anthelmintika)** vs **volně prodejný doplněk stravy**.
2. Named **byliny** education (pelyněk, ořešák, hřebíček, česnek, papája, kurkuma, dýňová semínka, tymián) — not just «sledujte složení».
3. **Délka kúry** + hydratace / hygienický režim.
4. Safety: těhotenství, děti, krev ve stolici, horečka → lékař.
5. Comparison tables (forms and/or byliny) + checklist bullets «na co se dívat».
6. Compliant wording: «podpora / přispívá k» — never «léčí / vyléčí / zaručený výsledek».

### Gaps vs thin Recenze Ceny hub (what this JSON must fix)

- 1-sentence sections → multi-paragraph useful copy (~800–1200 words total hub body).
- Missing H2: DS vs Rx; časté byliny.
- Wrong forms table (no gel/krém — use kapsle / kapky / sirup).
- Weak PAA; thin intro without comparison value (how to choose, vs detox, COD).

### What we already have (do not reinvent in JSON)

App already emits: product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping block, `/pruvodce/parasites` sibling for deep medical guide.

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep symptom/treatment encyclopedia → leave for `/pruvodce/parasites` (link it; do not duplicate full medical article).

**Forbidden:** competitor brand names (ParasitEx, Wurm-Ex, ČERVEX, Parasic, Vermophyt, Cleorix, Detoxicin, …); veterinary products; «léčí / vyléčí / zaručený výsledek»; fake AggregateRating; inventing product SKUs/rows for ItemList.

---

## Keyword cluster

- **primaryKeyword:** `doplňky stravy na parazity`
- **secondaryKeywords:** přípravky proti parazitům, prostředek proti parazitům, kapsle proti parazitům, antiparazitární doplněk stravy, bylinná kúra proti parazitům, očista od parazitů, střevní paraziti doplněk, pelyněk pravý, ořešák královský, hřebíček, česnek, papája, kurkuma, dýňová semínka, platba na dobírku
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words total); primary KW in sentence 1; dobírka + 2–5 dnů + ČR; DS ≠ lék / diagnóza; brief vs detox.
2. Sections (ids mandatory):
   - `pro-koho` — adults considering bylinná kúra; when to see a doctor (children, strong GI symptoms)
   - `jak-vybrat` — checklist bullets (délka kúry, složení/mg, forma, hydratace, paraziti vs detox)
   - `doplnek-vs-lek` — anthelmintika na předpis vs volný doplněk
   - `byliny` — LSI herbs education (no competitor brands, no dosing as medical protocol)
   - `formy` — kapsle / kapky / sirup only
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2:
   - Forms: Kapsle | Kapky | Sirup × kdy zvolit × na co se dívat
   - Byliny: common herb × role in kúra context × what to check on label
4. `hubLinks` (site-relative only):
   - `/pruvodce/parasites`
   - `/delivery`
   - `/medical-expert`
   - `/category/detox-cleanse`
   - `/category/digestive`
5. FAQ 6–8 topic pairs (kúra length, DS vs Rx, byliny, kombinace, děti/těhotenství, paraziti vs detox). COD/delivery PAA are merged by the app — you may omit pure shipping FAQs.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "parasites",
  "name": "Paraziti",
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
    { "label": "…", "path": "/pruvodce/parasites" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na parazity",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na parazity — od … Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy na parazity",
    "descriptionAngle": "bylinné kúry + DS≠lék + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `doplňky stravy na parazity`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `doplnek-vs-lek`, `byliny`, `bezpecnost`
- [ ] `hubTables.length >= 2` and **no** gel/krém rows
- [ ] `hubLinks.length >= 5` with paths starting `/`
- [ ] No competitor brand names; no «léčí/vyléčí»
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
