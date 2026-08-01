/** Editorial category hub copy (extends static content.cs). */

import { getCategoryContentByLang } from "./content";
import type { ContentSection, HubLink, HubTable } from "./content.cs";
import { getCategoryDescriptorByLang } from "./category-descriptors";
import { getCategorySeoIntent } from "./seo-intent.cs";
import { getI18n } from "./i18n";
import type { Lang } from "./lang";
import type { Offer } from "./types";
import { formatDisplayPrice } from "./market";
import { GUIDE_PATH, SITE } from "./site";
import { getNicheType, type NicheType } from "./niche-types";
import { editorialHowToChooseBody } from "./niche-content.cs";
import { offerDisplayTitle } from "./offer-display";

export type CategoryHubEditorial = {
  introHtml: string;
  comparisonHtml: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugifyHeading(heading: string): string {
  return heading
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function sectionId(s: ContentSection): string {
  return (s.id?.trim() || slugifyHeading(s.heading)) || "sekce";
}

const EDITORIAL_SKIP_HEADINGS = new Set([
  "Objednávka, doprava a platba",
  "Bezpečnost a upozornění",
  "Proč nám důvěřovat?",
]);

const SAFETY_HEADING_RE = /bezpečnost|kdy k lékaři|upozornění/i;

/** Hub already has a "how to choose" H2 — skip generic i18n boilerplate. */
function hasHowToChooseSection(sections: { heading: string; id?: string }[]): boolean {
  return sections.some((s) => {
    const id = (s.id ?? "").toLowerCase();
    const h = s.heading.trim();
    return (
      id === "jak-vybrat" ||
      id === "vyber-formy" ||
      /jak\s+vybrat|jakou\s+formu\s+zvolit|podle\s+čeho\s+vybrat|podle\s+ceho\s+vybrat/i.test(h)
    );
  });
}

function isSafetySection(s: ContentSection): boolean {
  return SAFETY_HEADING_RE.test(s.heading);
}

function renderTable(table: HubTable): string {
  const head = table.headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="editorial-table-wrap"><table>
<caption>${esc(table.caption)}</caption>
<thead><tr>${head}</tr></thead>
<tbody>${body}</tbody>
</table></div>`;
}

/** Split body on blank lines into multiple <p> (long-form hub copy). */
function paragraphsHtml(body: string): string {
  const parts = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  return parts.map((p) => `<p>${esc(p)}</p>`).join("");
}

function renderSectionHtml(s: ContentSection, asCallout = false): string {
  const id = sectionId(s);
  const bullets =
    s.bullets && s.bullets.length > 0
      ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
      : "";
  const bodyHtml = paragraphsHtml(s.body);
  if (asCallout) {
    return `<aside class="editorial-callout" id="${esc(id)}">
<p class="editorial-callout-title">${esc(s.heading)}</p>
${bodyHtml}${bullets}
</aside>`;
  }
  return `<h2 id="${esc(id)}">${esc(s.heading)}</h2>${bodyHtml}${bullets}`;
}

function renderToc(sections: ContentSection[], extra: { id: string; label: string }[]): string {
  const items = [
    ...sections.map((s) => ({ id: sectionId(s), label: s.heading })),
    ...extra,
  ];
  if (items.length < 2) return "";
  return `<nav class="editorial-toc" aria-label="Obsah">
<p class="editorial-toc-title">Obsah článku</p>
<ol>${items.map((i) => `<li><a href="#${esc(i.id)}">${esc(i.label)}</a></li>`).join("")}</ol>
</nav>`;
}

function absPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${p}`;
}

function defaultHubLinks(slug: string, name: string): HubLink[] {
  return [
    { label: `Průvodce výběrem: ${name}`, path: `${GUIDE_PATH}/${slug}` },
    { label: "Doručení a platba na dobírku", path: "/delivery" },
    { label: "Medical expert — odborný pohled", path: "/medical-expert" },
  ];
}

function renderHubLinks(links: HubLink[]): string {
  if (links.length === 0) return "";
  return `<ul class="editorial-links">${links
    .map((l) => `<li><a href="${esc(absPath(l.path))}">${esc(l.label)}</a></li>`)
    .join("")}</ul>`;
}

function dedupeSections(sections: ContentSection[]) {
  const seen = new Set<string>();
  return sections.filter((s) => {
    const key = s.heading.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildComparisonTable(offers: Offer[], lang: Lang): string {
  const T = getI18n(lang);
  const top = offers.slice(0, 5);
  if (top.length === 0) return "";
  const rows = top
    .map((o) => {
      const price =
        typeof o.priceEUR === "number" && o.priceEUR > 0
          ? formatDisplayPrice(o.priceEUR)
          : "—";
      const title = esc(offerDisplayTitle(o));
      const href = esc(`${SITE.url}/${o.categorySlug}/${o.slug}`);
      return `<tr><td><a href="${href}">${title}</a></td><td>${esc(o.formKind ?? "—")}</td><td>${esc(price)}</td></tr>`;
    })
    .join("");
  return `<div class="editorial-table-wrap"><table>
<thead><tr><th>${esc(T.category.editorialTableProduct)}</th><th>${esc(T.category.editorialTableForm)}</th><th>${esc(T.category.editorialTablePrice)}</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;
}

function guideChecklistItems(niche: NicheType): string[] {
  switch (niche) {
    case "supplement":
      return [
        "Složení a koncentrace účinných látek",
        "Forma: kapsle, kapky, krém nebo gel",
        "Délka kúry a cena za dávku",
        "Kompatibilita s léky na předpis (konzultace s lékařem)",
      ];
    case "device":
      return [
        "Určení přístroje a napájení (220 V, USB, baterie)",
        "Provozní režimy a obsah balení",
        "Český návod a záruční list",
        "Rozměry a způsob použití doma",
      ];
    case "auto":
      return [
        "Kompatibilita s vozem (rok, model, konektor)",
        "Napájení 12 V / USB a rozměry",
        "Způsob instalace (Plug & Play vs montáž)",
        "Záruka výrobce a obsah balení",
      ];
    case "garden":
      return [
        "Venkovní podmínky (déšť, mráz, slunce)",
        "Napájení (solární panel, baterie, síť)",
        "Materiál a odolnost krytu",
        "Sezónní dostupnost a dodací lhůta",
      ];
    case "fashion":
      return [
        "Tabulka velikostí a rozměry",
        "Složení materiálu a péče",
        "Sezónnost a určení modelu",
        "Podmínky výměny velikosti",
      ];
    case "home":
      return [
        "Rozměry, hmotnost a materiál",
        "Obsah balení a napájení",
        "Záruka a pokyny k údržbě",
        "Vhodnost pro děti nebo domácí mazlíčky",
      ];
    default:
      return [
        "Popis produktu a obsah balení",
        "Rozměry a materiály",
        "Záruka a podmínky vrácení",
        "Recenze a orientační cena",
      ];
  }
}

function whenDoctorParagraph(niche: NicheType): string {
  switch (niche) {
    case "supplement":
      return "Doplňky stravy nenahrazují lékaře. Při akutních příznacích, krvácení, horečce, silné bolesti nebo zhoršení stavu navštivte lékaře — neodkládejte diagnózu kvůli domácí kúře.";
    case "device":
      return "Domácí přístroje nejsou diagnostické. Při trvalých nebo náhlých příznacích se obraťte na specialistu — přístroj slouží pro pohodlí, ne pro stanovení diagnózy.";
    default:
      return "Pokud produkt nevyhovuje vašim potřebám nebo máte zdravotní pochybnosti, konzultujte situaci s odborníkem před dlouhodobým používáním.";
  }
}

export function buildCategoryHubEditorial(
  slug: string,
  offers: Offer[],
  lang: Lang = "cs",
): CategoryHubEditorial {
  const T = getI18n(lang);
  const content = getCategoryContentByLang(slug, lang);
  const d = getCategoryDescriptorByLang(slug, lang);
  const count = offers.length;
  const serpLed = content.serpLedHub === true;
  const allHub = dedupeSections(
    content.categorySectionsHi.filter((s) => !EDITORIAL_SKIP_HEADINGS.has(s.heading)),
  );
  const safetySections = allHub.filter(isSafetySection);
  const hubSections = allHub.filter((s) => !isSafetySection(s));
  const problemLine = d.problem.replace(/[.…]+$/u, "").trim();
  const countLabel = T.category.editorialProductCount(count);
  const howToChooseP = editorialHowToChooseBody(slug, content.nameHi);
  const guideHref = absPath(`${GUIDE_PATH}/${slug}`);
  const deliveryHref = absPath("/delivery");

  const howToChooseBlocks: string[] =
    serpLed || hasHowToChooseSection(hubSections)
      ? []
      : [
          `<h2 id="jak-vybrat">${esc(T.category.editorialHowToChooseH)}</h2>`,
          `<p>${esc(howToChooseP)}</p>`,
        ];

  const tocExtra: { id: string; label: string }[] = [];
  if (!serpLed && content.hubTables && content.hubTables.length > 0) {
    tocExtra.push({ id: "prehledove-tabulky", label: "Přehledové tabulky" });
  }
  if (!serpLed) {
    tocExtra.push({ id: "doprava-a-platba", label: T.category.editorialShippingH });
  }
  if (!serpLed && count > 0) {
    tocExtra.push({
      id: "nejlepsi-produkty",
      label: T.category.editorialTopProductsH(content.nameHi),
    });
  }
  for (const s of safetySections) {
    tocExtra.push({ id: sectionId(s), label: s.heading });
  }

  const tablesHtml =
    content.hubTables && content.hubTables.length > 0
      ? serpLed
        ? content.hubTables.map(renderTable).join("\n")
        : `<h2 id="prehledove-tabulky">Přehledové tabulky</h2>${content.hubTables.map(renderTable).join("\n")}`
      : "";

  const links = content.hubLinks?.length
    ? content.hubLinks
    : defaultHubLinks(slug, content.nameHi);

  // Rich hubs already state problem + value in categoryIntroHi — skip duplicate blurbs.
  const hasRichIntro = (content.categoryIntroHi?.trim().length ?? 0) >= 160;
  const introLead =
    serpLed || hasRichIntro
      ? []
      : [
          `<p>${esc(T.category.editorialCatalogLine(SITE.name, countLabel, content.nameHi))} Podrobný checklist najdete v <a href="${esc(guideHref)}">průvodci výběrem ${esc(content.nameHi)}</a>.</p>`,
          `<p>${esc(problemLine)}. ${esc(content.taglineHi ?? "")}</p>`,
        ];

  const shippingBlocks = serpLed
    ? []
    : [
        `<h2 id="doprava-a-platba">${esc(T.category.editorialShippingH)}</h2>`,
        `<p>${esc(T.category.editorialShippingP)} Více v sekci <a href="${esc(deliveryHref)}">doručení</a>.</p>`,
      ];

  const introHtml = [
    renderToc(
      [
        ...hubSections,
        ...(howToChooseBlocks.length
          ? [{ heading: T.category.editorialHowToChooseH, body: "", id: "jak-vybrat" }]
          : []),
      ],
      tocExtra,
    ),
    paragraphsHtml(content.categoryIntroHi),
    ...introLead,
    ...hubSections.map((s) => renderSectionHtml(s)),
    ...howToChooseBlocks,
    tablesHtml,
    ...shippingBlocks,
    renderHubLinks(links),
    ...safetySections.map((s) => renderSectionHtml(s, true)),
  ]
    .filter(Boolean)
    .join("\n");

  const comparisonHtml =
    !serpLed && count > 0
      ? `<h2 id="nejlepsi-produkty">${esc(T.category.editorialTopProductsH(content.nameHi))}</h2><p>${esc(T.category.editorialTopProductsLead)}</p>${buildComparisonTable(offers, lang)}`
      : "";

  return { introHtml, comparisonHtml };
}

/** Long-form buying guide — distinct from hub editorial (anti-cannibalization). */
export function buildCategoryGuideEditorial(
  slug: string,
  offers: Offer[],
  lang: Lang = "cs",
): CategoryHubEditorial {
  const T = getI18n(lang);
  const content = getCategoryContentByLang(slug, lang);
  const intent = getCategorySeoIntent(slug);
  const niche = getNicheType(slug);
  const keyword = intent.primaryKeyword || content.nameHi;
  const checklist = guideChecklistItems(niche);

  const introHtml = [
    `<p>${esc(T.guide.lead(content.nameHi))}</p>`,
    `<h2>${esc(T.guide.checklistH)}</h2>`,
    `<p>${esc(T.guide.checklistP(keyword))}</p>`,
    `<ul>${checklist.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`,
    `<h2>${esc(T.guide.whenDoctorH)}</h2>`,
    `<p>${esc(whenDoctorParagraph(niche))}</p>`,
    `<h2>${esc(T.guide.compareH)}</h2>`,
    `<p>${esc(T.guide.compareP(content.nameHi))}</p>`,
    `<h2>${esc(T.category.editorialHowToChooseH)}</h2>`,
    `<p>${esc(editorialHowToChooseBody(slug, content.nameHi))}</p>`,
  ].join("\n");

  const hub = buildCategoryHubEditorial(slug, offers, lang);
  return { introHtml, comparisonHtml: hub.comparisonHtml };
}
