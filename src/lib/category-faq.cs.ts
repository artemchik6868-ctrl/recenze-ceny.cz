/** Merge seo-intent PAA into category FAQ (deduped). */

import type { FaqItem } from "./content.cs";
import { getCategorySeoIntent } from "./seo-intent.cs";
import { getNicheType, type NicheType } from "./niche-types";

function paaAnswer(question: string, name: string, niche: NicheType): string {
  const q = question.toLowerCase();
  if (q.includes("doručení") || q.includes("doruceni")) {
    return "Obvykle 2–5 pracovních dnů expresním kurýrem po celé České republice. Po odeslání obdržíte SMS s kódem pro sledování.";
  }
  if (q.includes("dobírku") || q.includes("dobirku") || q.includes("platit")) {
    return "Ano — platba probíhá při převzetí balíčku, bez zálohy a skrytých poplatků.";
  }
  if (q.includes("originalitu") || q.includes("origináln")) {
    return "Spolupracujeme s oficiálními dodavateli; na balení je uvedeno číslo šarže a datum spotřeby.";
  }
  if (q.includes("nahrazuje") && (q.includes("lék") || q.includes("lek") || q.includes("vyšetření"))) {
    return "Ne. Jedná se o doplněk stravy nebo produkt pro domácí použití — nenahrazuje lékařskou diagnózu ani předepsanou terapii.";
  }
  if (q.includes("kombinovat") || q.includes("léky") || q.includes("leky")) {
    return "Při užívání léků na předpis se poraďte se svým lékařem o kompatibilitě před zahájením kúry.";
  }
  if (q.includes("jak dlouho")) {
    if (niche === "supplement") {
      return `U většiny přípravků v kategorii „${name}“ se doporučuje pravidelné užívání 4–12 týdnů podle schématu na obalu. První změny bývají individuální.`;
    }
    if (niche === "device") {
      return "Dodržujte frekvenci a dobu použití uvedenou v českém návodu — obvykle několik týdnů pravidelného používání.";
    }
    return "Doba použití závisí na konkrétním produktu — podrobnosti najdete v popisu a v balení.";
  }
  if (q.includes("tinnitu") || q.includes("sluch")) {
    return "Doplňky mohou podporovat každodenní komfort uší, ale nenahrazují ORL vyšetření. Při náhlém zhoršení sluchu vyhledejte lékaře.";
  }
  if (q.includes("cystitid") || q.includes("močení") || q.includes("mocen")) {
    return "Přípravky v této kategorii podporují komfort močových cest. Při horečce, krvi v moči nebo silné bolesti okamžitě kontaktujte lékaře.";
  }
  if (q.includes("krém") || q.includes("kapsle") || q.includes("gel")) {
    return "Volte podle preference: kapsle pro vnitřní podporu, krém nebo gel pro lokální aplikaci. Porovnejte složení a délku kúry v popisu produktu.";
  }
  if (q.includes("dieta") || q.includes("hubnutí") || q.includes("hubnuti")) {
    return "Ano — doplňky podporují metabolismus, ale nejsou náhradou vyvážené stravy a pohybu. Realistický výsledek vyžaduje změnu životního stylu.";
  }
  if (q.includes("chrápání") || q.includes("chrapani") || q.includes("spánek") || q.includes("spank")) {
    return "Některé produkty cílí na polohu hlavy a dýchací cesty při spánku. Při dlouhodobém chrápání zvažte konzultaci s ORL specialistou.";
  }
  if (q.includes("parazit")) {
    return "Typická kúra trvá 2–4 týdny podle schématu výrobce. Dodržujte hydrataci a vyváženou stravu během užívání.";
  }
  if (q.includes("plíseň") || q.includes("plisen") || q.includes("neht")) {
    return "Lokální přípravky se aplikují pravidelně po dobu několika týdnů až měsíců — důslednost aplikace je klíčová. Při infekci bez zlepšení navštivte dermatologa.";
  }
  if (q.includes("stres") || q.includes("spánek") || q.includes("paměť")) {
    return "Produkty v kategorii podporují klid a spánek — nejsou náhradou psychoterapie. Při úzkosti nebo nespavosti dlouhodobě se poraďte s lékařem.";
  }
  if (q.includes("trávení") || q.includes("traveni") || q.includes("střev")) {
    return "Doplňky podporují normální trávení a střevní komfort. Při krvi ve stolici, silné bolesti nebo dlouhotrvající průjmu vyhledejte lékaře.";
  }
  if (niche === "auto") {
    return "Zkontrolujte kompatibilitu s vaším vozem (rok, napájení 12 V/USB, rozměry) v popisu produktu. Při nevhodnosti zajistíme výměnu.";
  }
  if (niche === "fashion") {
    return "Použijte tabulku velikostí v popisu — při nejistotě zvolte větší velikost. Výměna je možná do 7 dnů.";
  }
  return `Odpověď závisí na konkrétním produktu v kategorii „${name}“ — složení, forma a délka kúry najdete na kartě produktu. Při pochybnostech nás kontaktujte před objednávkou.`;
}

export function mergeCategoryFaq(slug: string, name: string, base: FaqItem[]): FaqItem[] {
  const intent = getCategorySeoIntent(slug);
  const niche = getNicheType(slug);
  const seen = new Set<string>();
  const out: FaqItem[] = [];

  // Prefer hand-written hub answers over generic PAA templates.
  for (const item of base) {
    const key = item.q.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  for (const q of intent.paaQuestions) {
    const key = q.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ q, a: paaAnswer(q, name, niche) });
  }

  return out;
}
