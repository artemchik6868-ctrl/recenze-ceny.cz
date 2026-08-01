/**
 * Regenerate all *.es.ts language templates from *.it.ts sources using merged phrase maps.
 * Run: node scripts/regen-all-es-templates.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  ["src/lib/niche-content.it.ts", "src/lib/niche-content.es.ts"],
  ["src/lib/ai-content.it-fallbacks.ts", "src/lib/ai-content.es-fallbacks.ts"],
  ["src/lib/ai-content.it-prompts.ts", "src/lib/ai-content.es-prompts.ts"],
];

/** Load PHRASE arrays from sibling gen scripts (duplicate lists merged). */
function loadPhrasesFromFile(rel, exportName = "PHRASES") {
  const raw = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const start = raw.indexOf(`const ${exportName} = [`);
  if (start < 0) return [];
  const slice = raw.slice(start);
  const end = slice.indexOf("];");
  const body = slice.slice(`const ${exportName} = `.length, end + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${body}`)();
}

const phrases = [
  ...loadPhrasesFromFile("scripts/gen-content-es.mjs"),
  ...loadPhrasesFromFile("scripts/gen-reviews-es.mjs"),
  // Extra high-frequency IT → ES (longer phrases first in sort)
  ["Italian review bodies", "Spanish review bodies"],
  ["review-voice.it.ts", "review-voice.es.ts"],
  ["review-templates-theme.it", "review-templates-theme.es"],
  ["review-templates-slug.it", "review-templates-theme.es"],
  ["category-descriptors.it", "category-descriptors.es"],
  ["category-descriptors.uk", "category-descriptors.es"],
  ["niche-content.uk", "niche-content.es"],
  ["Italian content templates for the Italy market", "Spanish content templates for the Spain market"],
  ["Italian mirror of niche-content.es.ts (Spain market).", "Spanish mirror of niche-content.es.ts (Spain market)."],
  ["Informazioni su", "Información sobre"],
  ["Come ordinare", "Cómo pedir"],
  ["Come ricevere", "Cómo recibir"],
  ["Come assumere", "Cómo tomar"],
  ["Come agisce", "Cómo actúa"],
  ["Come aiuta", "Cómo ayuda"],
  ["Avvertenza", "Advertencia"],
  ["Avvertenze", "Advertencias"],
  ["Sicurezza e avvertenze", "Seguridad y advertencias"],
  ["Garanzia, reso e cambio", "Garantía, devolución y cambio"],
  ["Pagamento alla consegna", "Pago contra reembolso"],
  ["Pagamento in contrassegno", "Pago contra reembolso"],
  ["pagato alla consegna", "pagado contra reembolso"],
  ["pagamento alla consegna", "pago contra reembolso"],
  ["in tutta Italia", "en toda España"],
  ["in Italia", "en España"],
  ["tutta Italia", "toda España"],
  ["corriere espresso", "mensajería express"],
  ["corriere in", "mensajería en"],
  ["Spedizione rapida", "Envío rápido"],
  ["Consegna rapida", "Entrega rápida"],
  ["Consegna con", "Entrega con"],
  ["Consegna in", "Entrega en"],
  ["consegna in", "entrega en"],
  ["Operatore", "Asesor"],
  ["operatore", "asesor"],
  ["consulente", "asesor"],
  ["Consulente", "Asesor"],
  ["settimane", "semanas"],
  ["settimana", "semana"],
  ["giorni lavorativi", "días laborables"],
  ["giorni", "días"],
  ["giorno", "día"],
  ["mesi", "meses"],
  ["mese", "mes"],
  ["stelle", "estrellas"],
  ["integratore alimentare", "complemento alimenticio"],
  ["integratore", "complemento alimenticio"],
  ["Integratore", "Complemento alimenticio"],
  ["integratori", "complementos alimenticios"],
  ["Integratori", "Complementos alimenticios"],
  ["medicinale", "medicamento"],
  ["medicamento", "medicamento"],
  ["non medicamento", "no medicamento"],
  ["Dopo ", "Tras "],
  ["Prima ", "Antes "],
  ["Durante ", "Durante "],
  [" senza ", " sin "],
  [" con ", " con "],
  [" per ", " para "],
  [" nella ", " en la "],
  [" nelle ", " en las "],
  [" nel ", " en el "],
  [" negli ", " en los "],
  [" allo ", " al "],
  [" all'", " al "],
  [" dell'", " del "],
  [" l'", " el "],
  [" un'", " una "],
  [" è ", " es "],
  [" non ", " no "],
  [" più ", " más "],
  [" che ", " que "],
  [" mi ", " me "],
  [" ti ", " te "],
  [" ho ", " he "],
  [" ha ", " ha "],
  [" sono ", " estoy "],
  [" stato ", " estado "],
  [" stata ", " estado "],
  ["stata ", "estado "],
  ["stato ", "estado "],
  [" ginocchia ", " rodillas "],
  [" ginocchio ", " rodilla "],
  [" schiena ", " espalda "],
  [" testa ", " cabeza "],
  [" pelle ", " piel "],
  [" capelli ", " cabello "],
  [" unghie ", " uñas "],
  [" prostata ", " próstata "],
  [" pressione ", " presión "],
  [" Pressione ", " Presión "],
  [" emorroidi ", " hemorroides "],
  [" cistite ", " cistitis "],
  [" russare ", " roncar "],
  [" Russava ", " Roncaba "],
  [" rughe ", " arrugas "],
  ["Italia", "España"],
  ["italiano", "español"],
  ["Italiano", "Español"],
  ["in italiano", "en español"],
  ["istruzioni in italiano", "instrucciones en español"],
  ["contrassegno", "pago contra reembolso"],
  ["Contrassegno", "Pago contra reembolso"],
  ["corriere", "mensajería"],
  ["Corriere", "Mensajería"],
  ["spedizione", "envío"],
  ["Spedizione", "Envío"],
  ["consegna", "entrega"],
  ["Consegna", "Entrega"],
  ["ordine", "pedido"],
  ["Ordine", "Pedido"],
  ["imballaggio", "embalaje"],
  ["Imballaggio", "Embalaje"],
  ["prodotto", "producto"],
  ["Prodotto", "Producto"],
  ["prodotti", "productos"],
  ["Prodotti", "Productos"],
  ["città", "ciudades"],
  ["città.", "ciudades."],
  ["altre città", "otras ciudades"],
  ["tall", "talla"],
  ["talla", "talla"],
  ["confezione", "envase"],
  ["materiale", "material"],
  ["distributore", "distribuidor"],
  ["Distributore", "Distribuidor"],
  ["fornitore", "proveedor"],
  ["Fornitore", "Proveedor"],
  ["paese", "país"],
  ["Paese", "País"],
  ["paesi", "países"],
  ["lavorativi", "laborables"],
  ["lavoro", "trabajo"],
  ["Lavoro", "Trabajo"],
  ["autodoplnky", "coche"],
  ["dall'auto", "del coche"],
  ["dall'", "del "],
  ["auto e", "coche y"],
  ["guida", "conducción"],
  ["Guida", "Conducción"],
  ["guido", "conduzco"],
  ["Guido", "Conduzco"],
  ["mattina", "mañana"],
  ["mattino", "mañana"],
  ["sera", "noche"],
  ["Sera", "Noche"],
  ["notte", "noche"],
  ["Notte", "Noche"],
  ["pomeriggio", "tarde"],
  ["dopo", "después"],
  ["prima", "antes"],
  ["ancora", "todavía"],
  ["sempre", "siempre"],
  ["molto", "mucho"],
  ["poco", "poco"],
  ["bene", "bien"],
  ["male", "mal"],
  ["facile", "fácil"],
  ["difficile", "difícil"],
  ["veloce", "rápido"],
  ["rapida", "rápida"],
  ["rapido", "rápido"],
  ["Rapida", "Rápida"],
  ["Rapido", "Rápido"],
  ["comodo", "cómodo"],
  ["Comodo", "Cómodo"],
  ["comoda", "cómoda"],
  ["Comoda", "Cómoda"],
  ["gentile", "amable"],
  ["Gentile", "Amable"],
  ["chiaro", "claro"],
  ["Chiaro", "Claro"],
  ["chiare", "claras"],
  ["semplice", "sencillo"],
  ["Semplice", "Sencillo"],
  ["semplici", "sencillas"],
  ["originale", "original"],
  ["Originale", "Original"],
  ["sigillato", "sellado"],
  ["Sigillato", "Sellado"],
  ["sigillata", "sellada"],
  ["integro", "íntegro"],
  ["Integro", "Íntegro"],
  ["intatta", "íntacta"],
  ["intatto", "íntacto"],
  ["ritardo", "retraso"],
  ["Ritardo", "Retraso"],
  ["ritardata", "retrasada"],
  ["ritardato", "retrasado"],
  ["estrellas", "estrellas"],
  ["4 estrellas", "4 estrellas"],
  ["5 estrellas", "5 estrellas"],
  ["function it(", "function es("],
  ["export function it(", "export function es("],
  ["ItReviewBody", "EsReviewBody"],
  ["CATEGORY_IT_BODIES", "CATEGORY_ES_BODIES"],
  ["NICHE_TEMPLATES_IT", "NICHE_TEMPLATES_ES"],
  ["REVIEW_SLOTS_BY_THEME", "REVIEW_SLOTS_BY_THEME"],
  ["text_it", "text_es"],
  ["buildReviewVoiceGuideIT", "buildReviewVoiceGuideES"],
  ["buildItalianOutputGuide", "buildSpanishOutputGuide"],
  ["buildInventionPolicyBlockIT", "buildInventionPolicyBlockES"],
  ["buildShortFieldsGuideIT", "buildShortFieldsGuideES"],
  ["buildCatalogShelfGuideIT", "buildCatalogShelfGuideES"],
  ["buildNonMedicalBlockIT", "buildNonMedicalBlockES"],
  ["buildStructureSpecIT", "buildStructureSpecES"],
  ["buildDescHtmlToolHintIT", "buildDescHtmlToolHintES"],
  ["buildToolSchemaIT", "buildToolSchemaES"],
  ["buildFaqToolSchemaIT", "buildFaqToolSchemaES"],
  ["buildFaqUserPromptIT", "buildFaqUserPromptES"],
  ["ai-content.it-prompts", "ai-content.es-prompts"],
  ["ai-content.it-fallbacks", "ai-content.es-fallbacks"],
  ["category-descriptors.it", "category-descriptors.es"],
  ["pdp-variants", "pdp-variants"],
  ["Scrivi SOLO in italiano", "Escribe SOLO en español"],
  ["italiano latino", "español"],
  ["in italiano latino", "en español"],
  ["mai caratteri cirillici", "nunca caracteres cirílicos"],
  ["comprador italiano", "comprador español"],
  ["compri in Italia", "compres en España"],
  ["acquista in Italia", "compre en España"],
  ["da {price} in Italia", "desde {price} en España"],
  ["da {price}", "desde {price}"],
  [" — da {price}", " — desde {price}"],
  [", da {price}", ", desde {price}"],
  ["Prezzo e recensioni", "Precio y reseñas"],
  ["Scheda prodotto", "Ficha del producto"],
  ["Opinioni clienti", "Opiniones de clientes"],
  ["Scheda tecnica", "Ficha técnica"],
  ["Caratteristiche", "Características"],
  ["Uso domestico", "Uso doméstico"],
  ["Dispositivo", "Dispositivo"],
  ["Per la casa", "Para el hogar"],
  ["Gadget casa", "Gadget hogar"],
  ["Taglie e prezzo", "Tallas y precio"],
  ["Guida taglie", "Guía de tallas"],
  ["Moda Italia", "Moda España"],
  ["Abbigliamento", "Ropa"],
  ["Per la tua auto", "Para tu coche"],
  ["Accessori auto", "Accesorios coche"],
  ["Auto elettronica", "Electrónica coche"],
  ["Guida installazione", "Guía de instalación"],
  ["Giardino e orto", "Jardín y huerto"],
  ["Giardino", "Jardín"],
  ["Outdoor", "Outdoor"],
  ["Opinioni", "Opiniones"],
  ["recensioni", "reseñas"],
  ["Recensioni", "Reseñas"],
];

// Dedupe by `from`, keep longest first
const seen = new Set();
const merged = [];
for (const pair of phrases.sort((a, b) => b[0].length - a[0].length)) {
  if (!pair[0] || seen.has(pair[0])) continue;
  seen.add(pair[0]);
  merged.push(pair);
}

function transform(content, dstRel) {
  let out = content;
  for (const [from, to] of merged) {
    out = out.split(from).join(to);
  }
  out = out.replace(/\bit\(/g, "es(");
  if (dstRel.includes("review-templates-cat")) {
    out = out.replace(/review-voice\.it\.ts/g, "review-voice.es.ts");
    out = out.replace(/Italian review bodies/g, "Spanish review bodies");
  }
  if (dstRel.includes("niche-content.es")) {
    out = out.replace(
      /from "\.\/category-descriptors\.uk"/g,
      'from "./category-descriptors.es"',
    );
    out = out.replace(
      /import type { CategoryDescriptor } from "\.\/category-descriptors\.uk"/g,
      'import type { CategoryDescriptor } from "./category-descriptors.es"',
    );
  }
  return out;
}

for (const [srcRel, dstRel] of FILES) {
  const content = fs.readFileSync(path.join(ROOT, srcRel), "utf8");
  const out = transform(content, dstRel);
  fs.writeFileSync(path.join(ROOT, dstRel), out, "utf8");
  console.log("Wrote", dstRel);
}

console.log(`Done. ${merged.length} phrase rules applied.`);
