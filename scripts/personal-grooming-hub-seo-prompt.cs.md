# One-shot prompt — `/category/personal-grooming` hub SEO (Recenze Ceny)

**Scope:** only slug `personal-grooming` (`https://recenze-ceny.cz/category/personal-grooming`). Do **not** reuse copy, section templates, or keyword lists from other site hubs (supplements, home-gadgets, fashion). Do **not** polish or extend the current thin niche page text — invent a **fresh** catalog hub from CZ competitor SERP patterns below.

**Assortment scope (broad shelf):** zastřihovač vousů / holicí strojek, epilátor (vč. IPL vs pinzetová epilace vs depilace), kulma / styling vlasů, čistič uší (spirálový), zubní fasety / snap-on smile, bělení zubů (pero) — domestic personal-care devices and hygiene helpers. Not pharmacy cosmetics aisles, not medical diagnostics.

**Output:** JSON that maps to `CategoryContent` hub fields + `seoIntent` for `personal-grooming`.

---

## Dual role

1. **Czech SEO specialist** — win commercial-informational intent around `přístroje pro osobní péči` while remaining a **shoppable gadget catalog**, not a 4000-word test encyclopedia.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → who → how to choose → types → parameters → tables → safety/warranty callout → FAQ. Calm hygiene-tech tone (cs-CZ). Genre: commercial category hub.

---

## Competitor SERP audit (steal patterns — never copy paragraphs or brand names)

Queries researched: `přístroje pro osobní péči`, `zastřihovač vousů 2026`, `nejlepší holicí strojek`, `epilátor srovnání`, `čistič uší`, `snap on smile`, `osobní péče`.

| Competitor | Title / H1 pattern | Blocks / volume | Schema / meta | Tone / KW |
|------------|--------------------|-----------------|---------------|-----------|
| **co-vybrat** holicí strojky | Title: «Jak vybrat… \| Recenze, Test 2026»; H1: jak vybrat + commercial KW | ~4700 words; **6 tables**; H2: typ strojku, napájení, čištění, jak se holit | `Article` + og:type article; meta with ✅ bullets | Expert buying guide; Wet&Dry, planžeta/frézka |
| **critica** zastřihovače | Title: «Nejlepší zastřihovače vousů 2026»; H1 short commercial | ~2200 words; TOP table + use-case H3 («pro cesty», «všestranné»); pros lists | Article; Wet/Dry in meta | Scenario labels > bare SKU rank |
| **SpotřebitelskýTest** epilátory | H1: Nejlepší epilátory 2026 – recenze, test, srovnání | TOC; taxonomy IPL vs pinzeta vs depilátor; «Jak vybrat»; **FAQ block** | Article + comparison widgets | Clear method definitions + PAA |
| **dm / ambeauty** e-com | H1 = category name | Thin intro + filters; almost no tables/FAQ schema | Listing | Shop-first, weak depth |
| **Affiliate uši / smile** | Benefit H1; safety vs vatové tyčinky; estetika vs stomatologie | Long sales copy; weak Collection schema | Often thin Article | Fear/benefit; we keep calm device framing |

### Winning patterns to absorb

1. **Commercial H1 + year-free title** that still leads with primary KW (we drop year to keep ≤60 chars with brand).
2. **Type taxonomy** early: holení vs zastřihování vs epilace (pinzeta / IPL / depilace) vs styling vs uši vs úsměv/zuby.
3. **Parameter checklist** like guides: Wet&Dry, výdrž baterie, nástavce, citlivá pokožka, obsah balení, záruka — as a table, not a 15-column SKU matrix.
4. **Use-case framing** (critica): «pro cesty», «pro kontury», «pro celé tělo» — map to our types without naming competitor brands.
5. **FAQ** answering method questions (epilátor vs depilátor; uši vs vatové tyčinky; smile ≠ stomatologie).
6. **Gap we exploit:** e-com hubs lack comparison tables + FAQPage + dobírka clarity; guide sites lack shoppable CollectionPage + live product grid.

### Forbidden

- Competitor / OEM brand names in body (Philips, Braun, Remington, Wahl, Rowenta, Sencor, ETA, Gillette, Veet, Lumea, OneBlade, dm, …).
- Fake AggregateRating or invented TOP-9 product rows.
- Inventing SKUs for ItemList (app builds from live offers).
- Medical claims («léčí», «vyléčí», «zaručený výsledek»); do not promise dental or ENT outcomes.
- `/medical-expert` in hubLinks; heading must **not** contain «kdy k lékaři» (safety heading uses bezpečnost/upozornění only).
- Copying other Recenze Ceny hub wording.

---

## Keyword cluster

- **primaryKeyword:** `přístroje pro osobní péči`
- **secondaryKeywords:** zastřihovač vousů, holicí strojek, epilátor, kulma, čistič uší, zubní fasety, snap on smile, bělení zubů, voděodolný trimmer, Wet&Dry, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 2–3 short paragraphs (~100–140 words); primary KW in sentence 1; types; dobírka + 2–5 dnů + ČR.
2. Sections (ids mandatory):
   - `pro-koho`
   - `jak-vybrat` — checklist bullets (účel, citlivost, Wet&Dry, baterie, nástavce, balení)
   - `typy` — holení/zastřihování, epilace, styling vlasů, péče o uši, úsměv/zuby
   - `parametry` — na co se dívat před nákupem
   - `bezpecnost` — heading **must** match `/bezpečnost|upozornění/i` (e.g. «Bezpečnost: pokožka, uši a záruka»)
3. `hubTables` ≥ 2:
   - Typ × kdy zvolit × na co se dívat
   - Parametr (baterie / voděodolnost / nástavce / citlivá pokožka) × proč záleží × tip
4. `hubLinks` (site-relative only, ≥ 4, **no** medical-expert):
   - `/pruvodce/personal-grooming`
   - `/delivery`
   - `/returns`
   - `/category/beauty-tools`
   - `/category/anti-aging` (optional)
5. FAQ 6–8 topic pairs (typ vs typ, jak vybrat, uši vs vatové tyčinky, smile ≠ stomatologie, záruka, Wet&Dry). COD/delivery PAA are merged by the app — omit pure shipping FAQs.
6. `tagline` + `shortDesc`.
7. `keywords` array.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

**Anti-cannibalization:** hub = selection + how-to-choose + tables + CTA. Deep encyclopedia → `/pruvodce/personal-grooming` (link it; do not duplicate).

**What the app already emits:** product grid, live price table, CollectionPage + ItemList + BreadcrumbList + FAQPage, TOC from H2 ids, shipping chrome.

---

## Output JSON schema

```json
{
  "slug": "personal-grooming",
  "name": "Osobní péče",
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
    { "label": "…", "path": "/pruvodce/personal-grooming" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "přístroje pro osobní péči",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Přístroje pro osobní péči — od … Kč | Recenze Ceny",
    "h1Example": "Přístroje pro osobní péči",
    "descriptionAngle": "benefit + types + dobírka"
  }
}
```

## Checklist before return

- [ ] `seoIntent.primaryKeyword` = `přístroje pro osobní péči`
- [ ] Intro sentence 1 contains primaryKeyword
- [ ] Sections include `jak-vybrat`, `typy`, `parametry`, `bezpecnost`
- [ ] `hubTables.length >= 2`
- [ ] `hubLinks` have no `/medical-expert`
- [ ] No competitor brand names; no «kdy k lékaři» in headings
- [ ] FAQ answers plain text (FAQPage-ready)
- [ ] `metaHints.titleExample` ≤ 60 characters
- [ ] Soft honesty: čistič uší ≠ ORL zákrok; snap-on smile / fasety ≠ stomatologická náhrada
