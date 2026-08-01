# One-shot prompt — hair-care category hub only (`/category/hair-care`)

Do **not** reuse for other categories. Do **not** copy existing site hub texts. Source of truth: Czech SERP competitors (Vitalpoint, SvětFitness, Verge, SalonFame, Roveja, BENU patterns) + this brief.

## Role

You are a Czech SEO specialist + UX designer for a commercial category hub on Recenze Ceny (`recenze-ceny.cz`). Write original cs-CZ copy that beats competitor guides as a **neutral buyer guide + catalog**, not another branded “Top 7” list.

## SERP keywords

- **Primary (must appear in intro sentence 1):** `doplňky stravy na vlasy`
- **Secondary (natural H2/table/FAQ):** vitamíny na vlasy, vitamíny na vlasy a nehty, biotin na vlasy, komplex na vlasy, proti vypadávání vlasů, zinek, železo/ferritin, selen, křemík, MSM, L-methionin, L-cystein, vitamin D, kapsle vs lokální péče, délka kúry, platba na dobírku

## Steal these competitor patterns (structure only — never copy paragraphs or brand rankings)

1. Quick-scan overview above the fold (SalonFame / Verge summary box)
2. Selection criteria before products: komplexnost > megadóza biotinu; aditiva; délka balení (Vitalpoint test)
3. Anti-hype: „samotný biotin nestačí“ + časté chyby (SvětFitness)
4. Ingredient table: látka | role | typický signál (SalonFame / Vitalpoint)
5. Expectation timeline 8–12 týdnů / 3–6 měsíců; nehty často dřív než vlasy (Roveja)
6. Cause framing + kdy k lékaři; vnitřní + lokální (BENU)
7. Audience segments: stres, po porodu/dietě, řídnutí, muži/ženy — bez medical claims (Verge)
8. PAA-dense FAQ (8–10 topic Q&A)

## Compliance

- Doplněk stravy, nikoli lék. Use „podpora / přispívá k“, never „léčí / vyléčí / zaručený výsledek“.
- Red flags → dermatolog / tricholog (ložisková alopecie, náhlý výpad, bolest, hnisání, děti, těhotenství bez konzultace).
- No competitor brand names. No fake AggregateRating. No invented product rows.

## UX output rules

- Intro ~100–140 words (2 paragraphs).
- 6–8 H2 sections, each ~70–120 words + bullets where useful.
- Safety heading must match `/bezpečnost|kdy k lékaři/i`.
- ≥2 hubTables; hubLinks ≥4 with paths only: `/pruvodce/hair-care`, `/delivery`, `/medical-expert`, `/category/anti-aging` (optional extra related).
- FAQ 8–10 topic pairs (COD/shipping merged elsewhere — do not invent duplicates).
- Tone: calm pharmacy-adjacent Czech.

## Required section IDs (order)

1. `rychly-prehled` — Rychlý přehled: klíčové látky a časová osa  
2. `pro-koho` — Pro koho je kategorie „Péče o vlasy“  
3. `jak-vybrat` — Jak vybrat doplňky stravy na vlasy  
4. `ucinne-latky` — Účinné látky: biotin nestačí samotný  
5. `formy` — Formy: kapsle, tablety, medvídci a lokální péče  
6. `ocekavani` — Co očekávat a jak dlouho čekat  
7. `chyby` — Časté chyby při výběru vitamínů na vlasy  
8. `bezpecnost` — Bezpečnost a kdy k lékaři  

## Tables

1. Účinné látky — headers: Látka | Role ve výživě vlasů | Typický signál / poznámka  
2. Formy produktů — headers: Forma | Kdy zvolit | Na co se dívat  
3. (optional) Časová osa — headers: Období | Co sledovat | Realistické očekávání  

## Output

Valid fields for `SupplementHubPack`: taglineHi, shortDescHi, categoryIntroHi, categorySectionsHi, hubTables, hubLinks, categoryFaqHi, keywordsHi.
