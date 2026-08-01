# Digestive hub SEO prompt — `/category/digestive` only

**Scope:** generate Czech hub copy for Recenze Ceny category **Trávení** (`digestive`).  
**Do not** reuse wording, section IDs, or tables from other site hubs (joint-care, hemoroidy, potence, stress, etc.). Orient only on CZ SERP competitors for trávení / zažívání and the brief below.

---

## Role

You are:

1. **Czech SEO specialist** — win commercial + problem queries for digestion supplements.
2. **UX designer for a catalog hub** — scannable in ~10 seconds: TOC → intro → H2s → tables → safety → FAQ.

Tone: calm pharmacy-adjacent (cs-CZ). Genre: commercial category hub — not encyclopedia, not PDP, not deep medical guide.

---

## SERP keyword cluster (use naturally)

| Role | Phrases |
|------|---------|
| Primary | `doplňky stravy na trávení`, `doplňky stravy na podporu trávení` |
| Problem / PAA | `nadýmání a plynatost`, `doplňky na nadýmání`, `pocit těžkosti po jídle`, `pomalé trávení` |
| Type / LSI | `probiotika na trávení`, `prebiotika`, `trávicí enzymy`, `vláknina` (psyllium, inulin), `bylinné přípravky na trávení`, `střevní mikroflóra`, `zažívání` |
| Commercial | `platba na dobírku`, `doručení Česká republika` |

Primary KW **must** appear in sentence 1 of intro. H1/title at runtime = primary commercial phrase.

---

## Competitor strengths to beat (patterns only — never copy text or brand SKUs)

Observed on BrainMarket, Lékárna.cz, Pilulka, BENU, Vitalpoint:

1. **Taxonomy of types** — probiotika / prebiotika / trávicí enzymy / vláknina / bylinné přípravky as a decision map.
2. **Educational H2s** aligned with PAA — when probiotics make sense; role of fiber; support after a heavy meal.
3. **Problem framing** — nadýmání: causes + practical tipy (numbered lists), without diagnosing disease.
4. **Comparison tables** — typ × kdy zvolit × na co se dívat; látky × vztah × tip.
5. **Compliance** — doplněk stravy ≠ lék; red flags → lékař (krev ve stolici, hubnutí, silná bolest, podezření na IBD).

**Forbidden on this page:** gel/krém rows (irrelevant to digestion hub). Prefer kapsle/tablety, prášek/vláknina, kapky where relevant.

---

## Required page structure

1. **Intro** (~80–120 words): primary KW first; list the five types; lifestyle one-liner (režim, vláknina, pití, tempo jídla); COD + doručení 2–5 dnů ČR.
2. **H2 Pro koho** (`id: "pro-koho"`) — nadýmání, těžkost po jídle, nepravidelnost; who should see a doctor first.
3. **H2 Jak vybrat** (`id: "jak-vybrat"`) — problem → type → label checks (CFU/dávka/délka) → cena za den; bullets.
4. **H2 Typy přípravků** (`id: "typy"`) — probiotika vs enzymy vs vláknina/prebiotika vs byliny.
5. **Table 1** — Typ přípravku | Kdy zvolit | Na co se dívat.
6. **Table 2** — Látka / typ | K čemu se vztahuje | Tip při výběru.
7. **H2 Režim** (`id: "rezim"`) — short numbered tipy (Vitalpoint-style, shorter).
8. **H2 Bezpečnost** (`id: "bezpecnost"`) — doplněk ≠ lék / IBD / red flags.
9. **hubLinks** — `/pruvodce/digestive`, `/delivery`, `/medical-expert`, `/category/detox-cleanse` (optional related).
10. **FAQ** 6–8 topic Q&A (plain text). Shipping/COD may be omitted if merged by app from DEFAULT_PAA — still include 1 delivery-style answer if unsure.

---

## Compliance (hard)

- Use: „podpora / přispívá k / střevní komfort“.
- Never: „léčí / vyléčí / zaručený výsledek / nahradí léčbu IBD“.
- No competitor brand names, no fake AggregateRating, no invented product rows.

---

## Output JSON (map to `SupplementHubPack` + seoIntent)

```json
{
  "slug": "digestive",
  "name": "Trávení",
  "tagline": "…",
  "shortDesc": "…",
  "categoryIntro": "… (primaryKeyword in sentence 1)",
  "categorySections": [
    { "id": "pro-koho", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "jak-vybrat", "heading": "Jak vybrat doplňky stravy na trávení", "body": "…", "bullets": ["…"] },
    { "id": "typy", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "rezim", "heading": "…", "body": "…", "bullets": ["…"] },
    { "id": "bezpecnost", "heading": "Bezpečnost a kdy k lékaři", "body": "…" }
  ],
  "hubTables": [
    {
      "caption": "Typy přípravků na trávení — rychlé srovnání",
      "headers": ["Typ přípravku", "Kdy zvolit", "Na co se dívat"],
      "rows": [["…", "…", "…"]]
    },
    {
      "caption": "Časté složky v doplňcích na trávení",
      "headers": ["Látka / typ", "K čemu se vztahuje", "Tip při výběru"],
      "rows": [["…", "…", "…"]]
    }
  ],
  "hubLinks": [
    { "label": "Průvodce výběrem: Trávení", "path": "/pruvodce/digestive" },
    { "label": "Doručení a platba na dobírku", "path": "/delivery" },
    { "label": "Medical expert — odborný pohled", "path": "/medical-expert" },
    { "label": "Kategorie: Detoxikace", "path": "/category/detox-cleanse" }
  ],
  "categoryFaq": [{ "q": "…", "a": "…" }],
  "keywords": ["doplňky stravy na trávení", "…"],
  "seoIntent": {
    "primaryKeyword": "doplňky stravy na trávení",
    "secondaryKeywords": [
      "doplňky stravy na podporu trávení",
      "probiotika na trávení",
      "trávicí enzymy",
      "prebiotika",
      "nadýmání a plynatost",
      "platba na dobírku"
    ],
    "paaQuestions": [
      "Pomáhá při nadýmání a pomalém trávení?",
      "Probiotika, enzymy nebo byliny — co zvolit?",
      "Jakou roli hraje vláknina u trávení?",
      "Jak podpořit trávení po těžším jídle?",
      "Jak dlouho trvá kúra doplňku na trávení?",
      "Kdy raději k lékaři než po doplněk?"
    ]
  },
  "metaHints": {
    "titleExample": "Doplňky stravy na trávení — od … Kč | Recenze Ceny",
    "h1Example": "Doplňky stravy na trávení",
    "descriptionAngle": "taxonomy + střevní komfort + dobírka ČR"
  }
}
```

## Checklist

- [ ] Intro has primary KW in sentence 1; ~80–120 words
- [ ] No gel/krém in tables
- [ ] ≥2 hubTables; ≥5 sections including jak-vybrat + bezpecnost
- [ ] FAQ ≥6 topic pairs; clickable paths only on own site
- [ ] Original Czech — not paraphrased from BrainMarket/Lékárna/BENU/Vitalpoint paragraphs
