import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src/lib/content.cs.ts");
const cache = path.join(root, "scripts/.cache/translate-content-cz/content.cs.ts");

if (fs.existsSync(cache)) {
  fs.copyFileSync(cache, src);
}

let text = fs.readFileSync(src, "utf8");

const safetyBlock = `    {
      heading: "Bezpečnost a upozornění",
      body:
        "Tento produkt je doplněk stravy, nikoli lék. Není určen k diagnostice, léčbě nebo prevenci nemocí. Pokud užíváte léky na předpis, jste těhotná, kojíte nebo trpíte chronickým onemocněním, poraďte se před použitím se svým lékařem. Nedoporučuje se pro osoby mladší 18 let.",
    },`;

const quad = `${safetyBlock}\n${safetyBlock}\n${safetyBlock}\n${safetyBlock}`;
while (text.includes(quad)) {
  text = text.replace(quad, "    COMMON_SAFETY,");
}

const triple = `${safetyBlock}\n${safetyBlock}\n${safetyBlock}`;
while (text.includes(triple)) {
  text = text.replace(triple, "    COMMON_SAFETY,");
}

const pair = `${safetyBlock}\n${safetyBlock}`;
while (text.includes(pair)) {
  text = text.replace(pair, "    COMMON_SAFETY,");
}

text = text.replace(safetyBlock, "    COMMON_SAFETY,");

// Unique sections for categories that only had safety blocks
const extras = {
  "klouby": `    {
      heading: "Formy produktů",
      body:
        "V kategorii najdete kapsle, gely a spreje — volte podle preferované formy a toho, zda hledáte vnitřní podporu nebo lokální aplikaci.",
    },
    {
      heading: "Na co se zaměřit",
      body:
        "Sledujte složení (glukosamin, kurkuma, boswellia), délku kúry a cenu za dávku. U artritidy nebo silné bolesti vždy konzultujte lékaře.",
    },
    COMMON_SAFETY,`,
  "detox": `    {
      heading: "Jemné čištění trávení",
      body:
        "Doplňky v této kategorii podporují přirozené procesy trávení — nejsou to agresivní detox kúry. Důležitá je hydratace a vyvážená strava.",
    },
    COMMON_SAFETY,`,
  "hubnuti": `    {
      heading: "Realistická očekávání",
      body:
        "Doplňky podporují metabolismus a chuť k jídlu, ale nejsou náhradou stravy ani pohybu. Výsledek závisí na celkovém životním stylu.",
    },
    COMMON_SAFETY,`,
  "prostata": `    {
      heading: "Pro muže nad 40 let",
      body:
        "Produkty cílí na podporu prostaty a močových cest. Při náhlých potížích s močením nebo bolesti vyhledejte urologa.",
    },
    COMMON_SAFETY,`,
  "zrak": `    {
      heading: "Péče o oči v digitální době",
      body:
        "Doplňky s luteinem a zeaxanthinem doplňují výživu očí při dlouhém sledování obrazovek — nenahrazují oční vyšetření.",
    },
    COMMON_SAFETY,`,
  "hemoroidy": `    {
      heading: "Diskrétní objednávka",
      body:
        "Zásilky odesíláme v neutrálním balení. Při silném krvácení nebo akutní bolesti okamžitě kontaktujte lékaře.",
    },
    COMMON_SAFETY,`,
  "zdravi-zen": `    {
      heading: "Pro ženy všech věkových kategorií",
      body:
        "Formule podporují hormonální rovnováhu a energii. Těhotné a kojící ženy by měly užívání konzultovat s lékařem.",
    },
    COMMON_SAFETY,`,
};

for (const [slug, replacement] of Object.entries(extras)) {
  const re = new RegExp(
    `(slug: "${slug}"[\\s\\S]*?categorySections: \\[\\n)    COMMON_SAFETY,\\n  \\],`,
    "m",
  );
  text = text.replace(re, `$1${replacement}\n  ],`);
}

fs.writeFileSync(src, text);
console.log("fixed content.cs.ts");
