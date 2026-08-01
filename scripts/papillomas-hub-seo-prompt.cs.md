# One-shot prompt — `/category/papillomas` hub SEO (Recenze Ceny)

**Scope:** only this category. Do **not** reuse copy, section templates, or keyword lists from other site hubs (trávení, anti-aging, klouby, …). Do **not** rewrite or polish any existing thin page text — invent a fresh hub from CZ SERP competitor patterns below.

**Output:** JSON that maps 1:1 to `SupplementHubPack` + `seoIntent` fields for slug `papillomas`.

**Catalog reality:** shelf is **topical gel / local wart–papilloma care** (not oral «doplňky stravy na kůži»). Be honest: lokální gely a roztoky dle návodu výrobce. Education may mention pharmacy methods (kryoterapie, keratolyty) for comparison — do **not** invent SKUs we do not sell.

---

## Dual role

1. **Czech SEO specialist** — beat Lékárna.cz wart hubs, Herbatica gel PDPs, clinic articles (Vasmedic / BS Clinic), BENU pharmacy Q&A, and Removio-style commercial landings on usefulness + commercial intent + medical honesty.
2. **UX designer for catalog hubs** — scannable in ~10 s: TOC → Jak vybrat → differentiation table → methods → locations → safety → FAQ. Calm pharmacy-adjacent tone (cs-CZ).

---

## Competitor SERP brief (patterns to steal — never copy paragraphs or brand names)

Observed winners for queries like `přípravky na papilomy`, `gel na papilomy`, `gel na bradavice`, `přípravky na bradavice`, `odstranění papilomů doma`, `papilomy na krku`, `jak odstranit papilomy`:

| Pattern | What tops do | How we win |
|---------|--------------|------------|
| H1 / title | Commercial phrase first (`Přípravky na papilomy` / `Přípravky na bradavice`) | `primaryKeyword` = `přípravky na papilomy`; H1 aligns |
| Method taxonomy | Lékárna: kryoterapie / keratolyty / masti / pera | H2 metody + comparison table (gel vs roztok vs kryo vs lékař) |
| Type education | Ploché / stařecké / genitální; clinic: papilom vs fibrom | H2 papilom vs bradavice vs měkký fibrom — table |
| Location intent | Krk, podpaží, záhyby (clinic + PAA) | Dedicated H2 lokalita; obličej/sliznice → lékař |
| Safety honesty | BENU: true papilom often needs dermatologist; clinics: never cut/tie at home | Strong «kdy k lékaři» + forbidden DIY list |
| Ingredient UX | Herbatica: vlaštovičník, keratolyza, ochrana okolní kůže | Checklist in Jak vybrat + optional složky table |
| COD trust | Removio landings push dobírka / originalita | Intro + FAQ: dobírka, 2–5 dnů, ČR |
| FAQ / PAA | «Lze odstranit bez lékaře?», «jak dlouho aplikovat?» | 6–8 real Q&A for FAQPage |

**Forbidden:** competitor brand names (Lékárna, BENU, Pilulka, Herbatica, Urgo, Wartner, Duofilm, EndWarts, Kolodium, Removio competitor clones, clinic brand names); «léčí / vyléčí / zaručeně odstraní HPV / 100 %»; fake AggregateRating; inventing product SKUs; encouraging cutting, tying, or burning growths at home.

**Allowed claims style:** «lokální péče / dle návodu výrobce / může podpořit vzhled pokožky» — topický přípravek nebo kosmetická péče, **nikoli lék ani diagnóza**. Always: podezřelé útvary → dermatolog.

---

## Keyword cluster

- **primaryKeyword:** `přípravky na papilomy`
- **secondaryKeywords:** gel na papilomy, gel na bradavice, přípravky na bradavice, odstranění papilomů doma, papilomy na krku, papilomy v podpaží, kožní výrůstky, vlaštovičník na bradavice, platba na dobírku, doručení v České republice
- Put primary KW in sentence 1 of `categoryIntro`.
- Weave secondaries naturally into H2 headings/body/FAQ — no stuffing.

---

## Required UX blocks

1. `categoryIntro` — 80–120 words; primary KW in sentence 1; gel/topical honesty; dobírka + 2–5 dnů + ČR; topikum ≠ lék / ≠ diagnóza.
2. Sections (ids mandatory):
   - `pro-koho` — drobné výrůstky, estetika, tření oblečením; red flags → dermatolog
   - `jak-vybrat` — checklist: lokalita, forma, návod, ochrana okolní kůže, kdy k lékaři
   - `rozliseni` — papilom vs bradavice vs měkký fibrom (education, not self-diagnosis)
   - `metody` — gel/roztok vs keratolyty vs kryoterapie vs lékař
   - `lokalita` — krk, podpaží, obličej, sliznice
   - `bezpecnost` — heading must match `/bezpečnost|kdy k lékaři/i`
3. `hubTables` ≥ 2 (prefer 3):
   - Formy: Gel | Roztok | Kryoterapie (edukace) | Lékař × kdy zvolit × na co se dívat
   - Papilom / bradavice / fibrom × typický vzhled × doporučení
   - Lokalita × doporučení (krk / podpaží / obličej / sliznice)
4. `hubLinks` (paths absolute site-relative):
   - `/pruvodce/papillomas`
   - `/delivery`
   - `/medical-expert`
   - `/category/fungus`
   - `/category/anti-aging`
5. FAQ 6–8 pairs: topic PAA (bez lékaře?, jak dlouho aplikovat, obličej, krk/podpaží, gel vs lékař, DIY nebezpečí) — **do not** invent oral «4–12 týdnů užívání» for gels; COD/delivery come from merge — omit or keep brief.
6. `tagline` + `shortDesc` for hero/meta helpers.
7. `keywords` array for internal KW list.
8. `seoIntent` with primary/secondary/paaQuestions.
9. `metaHints` for QA only (title ≤60 chars starting with KW intent).

---

## Output JSON schema

```json
{
  "slug": "papillomas",
  "name": "Papilomy",
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
    { "label": "…", "path": "/pruvodce/papillomas" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["…"],
  "seoIntent": {
    "primaryKeyword": "přípravky na papilomy",
    "secondaryKeywords": ["…"],
    "paaQuestions": ["…"]
  },
  "metaHints": {
    "titleExample": "Přípravky na papilomy — od … Kč | Recenze Ceny",
    "h1Example": "Přípravky na papilomy",
    "descriptionAngle": "gel/topical honesty + kdy k lékaři + dobírka"
  }
}
```

Return **only** valid JSON (no markdown fence commentary outside the object).
