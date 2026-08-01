import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src/lib/ai-content.examples.hu.ts",
);

function applyPhrases(text, phrases) {
  const sorted = [...phrases].sort((a, b) => b[0].length - a[0].length);
  let out = text;
  for (const [from, to] of sorted) out = out.split(from).join(to);
  return out;
}

const BLOCKS = [
  [
    `export const FORM_UNKNOWN_GUIDE = \`=== FORM AUS FEED (când formă în brief «produs» sau unklar) ===
Landing-titlu și sfârșitul feed-ului lesen — formă nu ghici.
Signale: kapljice / drops / kapi / капли → picături | kapsule / capsule → capsule | čaj / tea → ceai
articulații: gel za sklepe → ízületi gél | kapsule za sklepe / capsule → ízületi kapszulák

JÓ:
- W-Loss (shujšanje) → «testsúlykontroll cseppek», h2 «Administrare» cu picături în apă
- Abslim (shujšanje) → «testsúlykontroll cseppek», h2 «Administrare» cu Pipette/picături
- ArtiZynt (gel za sklepe) → «ízületi gél», h2 «Aplicare» cu Auftrag
- ArtiZynt (kapsule za sklepe) → «ízületi kapszulák», h2 «Administrare» cu apă
- Hondrofrost (cooling gel / nur brand pe joint-care) → «ízületi gél», h2 «Aplicare» cu Auftrag
- Hondrofrost SI / AT / DE (minimaler titlu feed, Shakes-Landing) → «ízületi gél», nu capsule wegen joint-care
- Hondro Sol (spray / sprej za sklepe) → «ízületi spray», h2 «Aplicare» cu Spray aplică
- Promicil (ciupercă unghială) → «körömgomba elleni krém», h2 «Aplicare» cu aplicare pe unghie
- Removio (papiloame) → «papilloma elleni gél», h2 «Aplicare» cu Auftrag pe Warze
- InsuLevel / Balansulin (Blutzucker) → «Supliment pentru reglarea glicemiei» — nu digestie
- Cortitron (weight loss) → «testsúlykontroll kapszulák», h2 «Administrare» cu apă
- Parazol → «parazita elleni tea», h2 «Aplicare» cu Aufguss

ROSSZ:
- W-Loss → capsule (formă nu în feed)
- Abslim → capsule sau «60 capsule» (Shakes-Abiau-SKU = picături)
- ArtiZynt → ízületi gél doar din cauza brand (fără gel în feed)
- Hondrofrost → étrend-kiegészítő/capsule când es un ízületi gél este
- Hondro Sol → capsule/supliment când feed Spray/sprej nennt
- Promicil → capsule când es o ciupercă unghială-cremă este
- Removio → capsule când es un Papillom-Gel este
- InsuLevel / Balansulin → digestie/stomac-intestin când feed Blutzucker/Diabetes nennt
- «ceai sau capsule» în selben text
- Abiau-SKU automatisch als capsule, când Landing kapljice/drops nennt\`;`,
    `export const FORM_UNKNOWN_GUIDE = \`=== FORMA A FEED-BŐL (ha a briefben «termék» vagy nem egyértelmű) ===
Olvasd a landing címét és a feed végét — ne találd ki a formát.
Jelek: kapljice / drops / kapi / капли → cseppek | kapsule / capsule → kapszulák | čaj / tea → tea
ízületek: gel za sklepe → ízületi gél | kapsule za sklepe / capsule → ízületi kapszulák

JÓ:
- W-Loss (shujšanje) → «testsúlykontroll cseppek», h2 «Adagolás» cseppek vízben
- Abslim (shujšanje) → «testsúlykontroll cseppek», h2 «Adagolás» pipettával/cseppekkel
- ArtiZynt (gel za sklepe) → «ízületi gél», h2 «Alkalmazás» felvitel
- ArtiZynt (kapsule za sklepe) → «ízületi kapszulák», h2 «Adagolás» vízzel
- Hondrofrost (cooling gel / csak márka joint-care polcon) → «ízületi gél», h2 «Alkalmazás» felvitel
- Hondrofrost SI / AT / DE (minimális feed cím, Shakes-landing) → «ízületi gél», ne kapszula joint-care miatt
- Hondro Sol (spray / sprej za sklepe) → «ízületi spray», h2 «Alkalmazás» spray felvitel
- Promicil (körömgomba) → «körömgomba elleni krém», h2 «Alkalmazás» körömre
- Removio (papilloma) → «papilloma elleni gél», h2 «Alkalmazás» szemölcsre
- InsuLevel / Balansulin (Blutzucker) → «vércukorszint szabályozó étrend-kiegészítő» — ne emésztés
- Cortitron (weight loss) → «testsúlykontroll kapszulák», h2 «Adagolás» vízzel
- Parazol → «parazita elleni tea», h2 «Elkészítés» főzés

ROSSZ:
- W-Loss → kapszula (forma nincs a feedben)
- Abslim → kapszula vagy «60 kapszula» (Shakes-fogyás SKU = cseppek)
- ArtiZynt → ízületi gél csak márka miatt (nincs gel a feedben)
- Hondrofrost → étrend-kiegészítő/kapszula, ha ízületi gél a termék
- Hondro Sol → kapszula/étrend-kiegészítő, ha a feed spray/sprej
- Promicil → kapszula, ha körömgomba krém a termék
- Removio → kapszula, ha papilloma gél a termék
- InsuLevel / Balansulin → emésztés/gyomor-bél, ha a feed Blutzucker/Diabetes
- «tea vagy kapszula» ugyanabban a szövegben
- Abiau-SKU automatikusan kapszulaként, ha a landing kapljice/drops\`;`,
  ],
  [
    `export const COMPOSITION_THIN_FEED_GUIDE = \`=== COMPOZIȚIE LA FEED SLAB ===
Când feed-ul nu listează ingrediente — spune deschis că «compoziția exactă nu figurează în fișa produsului» și menționează componente frecvente în produse similare (marchează ca context de categorie, nu ca fapte despre acest SKU).

BUN (parasites / capsule): «Compoziția exactă nu este listată. În suplimente similare apar frecvent pelin, nucă neagră, extract de neem — verificați eticheta la livrare.»
BUN (vision-eye-care / capsule): «Fișa nu detaliază ingredientele. În formule pentru ochi apar frecvent luteină, zeaxantină, vitamina A, zinc.»
BUN (joint-care / gel): «Compoziția nu este specificată. În geluri topice pentru articulații apar frecvent arnică, mentol, camomile.»

RĂU (inventat ca fapt):
- «Conține glucozamină 500 mg, condroitină 400 mg»
- Komponent A, ingredient 1, component X\`;`,
    `export const COMPOSITION_THIN_FEED_GUIDE = \`=== ÖSSZETÉTEL GYENGE FEEDNÉL ===
Ha a feed nem sorolja fel az összetevőket — mondd nyíltan, hogy «a pontos összetétel nem szerepel a termékleírásban», és említs gyakori összetevőket hasonló termékekben (kategória-kontextusként, ne mint tényleges állítás erről a SKU-ról).

JÓ (parasites / kapszula): «A pontos összetétel nincs feltüntetve. Hasonló étrend-kiegészítőkben gyakran szerepel üröm, fekete dió, neem kivonat — ellenőrizze a címkét szállításkor.»
JÓ (vision-eye-care / kapszula): «A leírás nem részletezi az összetevőket. Szemformulákban gyakran lutein, zeaxantin, A-vitamin, cink szerepel.»
JÓ (joint-care / gél): «Az összetétel nincs megadva. Topikus ízületi gélekben gyakran árnika, mentol, kamilla.»

ROSSZ (kitalált tényként):
- «500 mg glükózamin, 400 mg kondroitin tartalmat»
- Komponens A, összetevő 1, komponens X\`;`,
  ],
];

const PHRASES = [
  ["scrie despre ", "írj a következőkről: "],
  ["scrie exclusiv despre ", "kizárólag írj a következőkről: "],
  ["Írd nu despre ", "Ne írj a következőkről: "],
  ["Írd despre ", "Írj a következőkről: "],
  ["suport masculină vitalitate", "férfi vitalitás támogatás"],
  ["renunțare la fumat gumă de mestecat", "dohányzásról leszokás rágógumi"],
  ["capsule pentru controlul — greutății", "testsúlykontroll kapszulák"],
  ["capsule pentru — cesteită", "hólyaggyulladás elleni kapszulák"],
  ["capsule pentru cesteită", "hólyaggyulladás elleni kapszulák"],
  ["capsule pentru — prostată", "prosztata kapszulák"],
  ["capsule pentru — articulații", "ízületi kapszulák"],
  ["Curățător uscat auto — accesoriu pentru curățenie auto", "Száraz autótisztító — autótisztító kiegészítő"],
  ["Aspirator USB compact — electrocasnic pentru casă", "Kompakt USB porszívó — háztartási készülék"],
  ["comprimate împotriva paraziți", "parazita elleni tabletták"],
  ["capsule pentru suport la hallux valgus", "bütyök támogató kapszulák"],
  ["cremă la hemoroizi", "hemorroida elleni krém"],
  ["látás támogató kapszulákgesșiheit", "látás támogató kapszulák"],
  ["ochipflegeprodukt pentru aplicare externă", "külsőleges szemápoló termék"],
  ["dispozitiv ortopedic / clamă silicon", "ortopédiai eszköz / szilikon sín"],
  ["ortopedicer corector / clamă silicon", "ortopéd korrektor / szilikon sín"],
  ["capsule tensiune arterială-produs", "vérnyomás kapszulák"],
  ["Gelenkkorrektor", "ízületkorrektor"],
  ["gel tautologic", "tautologikus gél"],
  ["Sehkorrektur", "látásjavítás"],
  ["Picături într-un pahar cu apă sau pe o lingură conform fișei produsului — 1–2× zilnic", "Cseppeket egy pohár vízbe vagy kanálra a termékleírás szerint — naponta 1–2×"],
  ["Pregătit ca ceai sau capsule conform instrucțiunilor", "Teaként vagy kapszulaként elkészíteni az utasítás szerint"],
  ["O ceașcă cu apă fierbinte conform fișei produsului — 1–2× zilnic după masă", "Egy csésze forró víz a termékleírás szerint — naponta 1–2× étkezés után"],
  ["capsule sau picături statt einer Tasse ceai iaun", "kapszula vagy cseppek tea helyett"],
  ["Înghiți numărul prescis de capsule cu apă suficientă — meeste 1–2× zilnic", "A előírt számú kapszulát elegendő vízzel lenyelni — általában naponta 1–2×"],
  ["Wie ceai zubereiten sau stattdessen picături picură lassen", "Teát főzni vagy helyette cseppeket csepegtetni"],
  ["Înghiți comprimatele cu apă conform fișei produsului — meeste 1–2× zilnic", "A tablettákat vízzel a termékleírás szerint lenyelni — általában naponta 1–2×"],
  ["Wie ceai zubereiten sau in capsule umwandeln", "Teát főzni vagy kapszulává alakítani"],
  ["Eine subțire cremăschicht de 2–3 ori zilnic aplică și masați udel", "Vékony krémréteget naponta 2–3× felvinni és masszírozni"],
  ["2 capsule zilnic cu apă la unei mese iaun", "Naponta 2 kapszula vízzel étkezéskor"],
  ["Eine kleine Menge Gel de 2–3 ori zilnic pe betroffenen articulații aplică și masați udel", "Kis mennyiségű gélt naponta 2–3× az érintett ízületekre felvinni és masszírozni"],
  ["capsule oral 1–2× zilnic iaun, «gel tautologic» als descriptor, sau H1 «capsule» la ízületi gél în text", "szájon át 1–2× naponta, «tautologikus gél» leíró, vagy H1 «kapszula» ízületi gél szövegben"],
  ["1–2 capsule zilnic cu apă peste 30 zile — curs oral pentru suport beim renunțare", "Naponta 1–2 kapszula vízzel 30 napig — szájon át leszokástámogató kúra"],
  ["Nikotinkaugummi kauen sau gumă de mestecat statt înghiți capsule", "nikotinos rágógumi rágása kapszula helyett"],
  ["1–2 capsule zilnic cu apă la unei mese — orală suport", "Naponta 1–2 kapszula vízzel étkezéskor — szájon át támogatás"],
  ["Hilfscutel pe Zeh anlegen și 3–6 Stșien zilnic tragen", "Segédvédőt a lábujjra és naponta 3–6 órát viselni"],
  ["1–2 capsule zilnic cu apă la unei mese — orală suport vederes", "Naponta 1–2 kapszula vízzel étkezéskor — szájon át látástámogatás"],
  ["extern aplică, ochipicură, Sehkorrektur sau Brille/Linse", "külsőleges alkalmazás, szemcsepp, látásjavítás vagy szemüveg/lencse"],
  ["Eine subțire cremăschicht de 2–3 ori zilnic în zona intimă aplică și masați udel", "Vékony krémréteget naponta 2–3× az intim területen felvinni és masszírozni"],
  ["Spray conform fișa produsului pe betroffenen Bereich aplică — 2–3× zilnic", "Spray a termékleírás szerint az érintett területre — naponta 2–3×"],
  ["Hilfscutel pe Zeh tragen sau capsule oral iaun", "Segédvédő viselése a lábujjon vagy szájon át kapszula"],
  ["1–2 capsule zilnic cu apă la unei mese — curs oral ~30 zile", "Naponta 1–2 kapszula vízzel étkezéskor — ~30 napos szájon át kúra"],
  ["aplicați cremă, aplicare externă în zona intimă, topice îngrijire statt administrare", "krém felvitele, külsőleges alkalmazás intim területen, topikus ápolás bevitel helyett"],
  ["picături în apă 10–15 picături 1–2× zilnic înainte de masă", "cseppek vízben 10–15 csepp naponta 1–2× étkezés előtt"],
  ["capsule cu apă iaun", "kapszula vízzel étkezéskor"],
  ["picături în apă sau pe einen lingură conform fișa produsului — 1–2× zilnic", "cseppek vízben vagy kanálra a termékleírás szerint — naponta 1–2×"],
  ["capsule cu apă iaun, «60 capsule» erfinden", "kapszula vízzel, «60 kapszula» kitalálása"],
  ["1–2 capsule zilnic cu apă — curs oral ~30 zile", "Naponta 1–2 kapszula vízzel — ~30 napos szájon át kúra"],
  ["Gel pe articulații aplică, când feed kapsule/capsule nennt", "Gél ízületekre, ha a feed kapszulát említ"],
  ["capsule cu apă iaun, «supliment zur oralăn administrare», «étrend-kiegészítő schlucken»", "kapszula vízzel, «szájon át bevitel», «étrend-kiegészítő lenyelése»"],
  ["Eine kleine Menge Gel de 2–3 ori zilnic pe betroffene articulații aplică și masați udel", "Kis mennyiségű gélt naponta 2–3× az érintett ízületekre felvinni és masszírozni"],
  ["capsule cu apă iaun doar din cauza brand Hondrofrost sau joint-care-bucket", "kapszula vízzel csak Hondrofrost márka vagy joint-care bucket miatt"],
  ["Spray conform fișa produsului pe betroffene articulații aplică — 2–3× zilnic", "Spray a termékleírás szerint az érintett ízületekre — naponta 2–3×"],
  ["capsule cu apă iaun, «supliment schlucken», «60 capsule»", "kapszula vízzel, «étrend-kiegészítő lenyelése», «60 kapszula»"],
  ["Eine subțire cremăschicht de 2–3 ori zilnic pe Nagel și zona unghiei aplică", "Vékony krémréteget naponta 2–3× a körömre és körömágyra"],
  ["capsule cu apă iaun, «60 capsule», administrare orală în loc de aplicare topică", "kapszula vízzel, «60 kapszula», szájon át bevitel topikus alkalmazás helyett"],
  ["Eine kleine Menge Gel de 2–3 ori zilnic direkt pe Warze aplică", "Kis mennyiségű gélt naponta 2–3× közvetlenül a szemölcsre"],
  ["capsule cu apă iaun, «60 capsule», curs oral statt topicer aplicare", "kapszula vízzel, «60 kapszula», szájon át kúra topikus alkalmazás helyett"],
  ["produs de confort, vitalitate (auch când feed nur nume brandn nennt)", "komfort termék, vitalitás (ha a feed csak márkanevet említ)"],
  ["formă: ${form} → Ziel-descriptor:", "forma: ${form} → cél leíró:"],
  ["«${form} pentru neuropatie» sau «produs pentru neuropatie»", "«${form} neuropátiára» vagy «neuropátia elleni termék»"],
  ["«supliment pentru sistemul nervos», «Suplimente anti stres», «memorie și concentrare»", "«idegrendszer étrend-kiegészítő», «stressz elleni étrend-kiegészítő», «memória és koncentráció»"],
  ["«${form} împotriva ciupercii unghiei»", "«${form} körömgomba ellen»"],
  ["«cremă antifungică», «spray topic», «aplicare pe unghie» (când formă = capsule)", "«gombaellenes krém», «topikus spray», «körömre való felvitel» (ha forma = kapszula)"],
  ["Supliment pentru reglarea glicemiei", "vércukorszint szabályozó étrend-kiegészítő"],
  ["memorie, concentrare și claritate mentală", "memória, koncentráció és mentális tisztaság"],
  ["greutate corporală, apetit sau metabolism", "testsúly, étvágy vagy anyagcsere"],
  ["stres, anxietate, Suplimente anti stres sau liniște interioară", "stressz, szorongás, stressz elleni étrend-kiegészítő vagy belső nyugalom"],
  ["neuropatie, disconfort nervos periferic, senzații de furnicături", "neuropátia, perifériás idegi diszkomfort, bizsergés"],
  ["supliment pentru sistemul nervos, stres, memorie generică sau anxietate", "idegrendszer étrend-kiegészítő, stressz, általános memória vagy szorongás"],
  ["capsule orală, infecție fungică unghială, administrare cu apă", "szájon át kapszula, körömgomba fertőzés, vízzel bevitel"],
  ["cremă antifungică, spray topic sau aplicare pe unghie", "gombaellenes krém, topikus spray vagy körömre való felvitel"],
  ["rinichi, căi urinare și általános közérzet sesteem excretor", "vesék, húgyutak és kiválasztórendszer általános közérzete"],
  ["cesteită, ardere la urinare sau inflamație acută vezică urinară", "hólyaggyulladás, vizelési égés vagy akut hólyaggyulladás"],
  ["tüdő, respirație, ceai din plante și légzőszervi utak", "tüdő, légzés, gyógynövény tea és légzőszervi utak"],
  ["sistem nervos, stres, anxietate sau memorie", "idegrendszer, stressz, szorongás vagy memória"],
  ["sistem imunitar, apărare, zinc și vitamine", "immunrendszer, védelem, cink és vitaminok"],
  ["memorie, concentrare, stres sau sistem nervos", "memória, koncentráció, stressz vagy idegrendszer"],
  ["Auftrag pe Haut, locale aplicare, masaj — cremă sau Gel", "bőrre felvitel, helyi alkalmazás, masszázs — krém vagy gél"],
  ["capsule orală, administrare cu apă sau «2 capsule zilnic»", "szájon át kapszula, vízzel bevitel vagy «naponta 2 kapszula»"],
  ["digestie, paraziți, Darm și capsule orală", "emésztés, paraziták, bél és szájon át kapszula"],
  ["negi, Muttermale sau Haut (auch nu în Negation «nu confșia cu negi»)", "szemölcsök, anyajegyek vagy bőr (tagadásban sem «ne keverd szemölccsel»)"],
  ["potență, erecție, libido și capsule orală", "potencia, erekció, libidó és szájon át kapszula"],
  ["tensiune arterială, hipertensiune sau sănătate cardiovasculară", "vérnyomás, magas vérnyomás vagy szív-érrendszeri egészség"],
  ["articulații, cartilaj, mobilitate și confort articular", "ízületek, porc, mozgékonyság és ízületi komfort"],
  ["ficat, Reishi, ficatentgiftung", "máj, Reishi, máj tisztítás"],
  ["curățenie casnică, suprafețe, dispozitiv sau casnicsputz", "háztartási takarítás, felületek, eszköz vagy háztartási tisztítás"],
  ["paraziți, curățare intestinală, capsule orală, Wermut/Schwarznuss", "paraziták, bél tisztítás, szájon át kapszula, üröm/fekete dió"],
  ["digestie, digestiestrakt, gastrointestinal, supliment pentru digestie", "emésztés, emésztőrendszer, gyomor-bél, emésztés étrend-kiegészítő"],
  ["curățare, toxine sau detoxifiere corpului", "tisztítás, toxinok vagy test detox"],
  ["capsule orală, administrare cu apă, suport pentru picior", "szájon át kapszula, vízzel bevitel, láb támogatás"],
  ["clamă silicon, dispozitiv ortopedic sau Purtare pe Zeh", "szilikon sín, ortopédiai eszköz vagy lábujjra viselés"],
  ["hemoroizi, zone sensibile, disconfort la stat jos și capsule", "hemorroidák, érzékeny területek, ülés közbeni diszkomfort és kapszulák"],
  ["confort intim sau generală probleme intime (eufemisme)", "intim komfort vagy általános intim problémák (eufémizmusok)"],
  ["ciuperci unghii/piele, Gelauftrag și antifungale îngrijire", "köröm/bőr gomba, gél felvitel és gombaellenes ápolás"],
  ["anti-îmbătrânire, riduri, întinerire sau anti-îmbătrânire-îngrijire", "anti-aging, ráncok, fiatalítás vagy anti-aging ápolás"],
  ["locale aplicare, unghii, infecție fungică și Infektion", "helyi alkalmazás, körmök, gombafertőzés és fertőzés"],
  ["intinerirea pielii, riduri sau imbatranire", "bőrfiatalítás, ráncok vagy öregedés"],
  ["greutate, apetit, metabolism și capsule", "testsúly, étvágy, anyagcsere és kapszulák"],
  ["respirație sau bronhii", "légzés vagy hörgők"],
  ["sănătate oculară, vedere, Lutein și capsule orală", "szem egészség, látás, lutein és szájon át kapszula"],
  ["controlul greutății, apetit, metabolism sau Abiau", "testsúlykontroll, étvágy, anyagcsere vagy fogyás"],
  ["Lutein, vedere, oboseală de la ecran și capsule orală pentru ochi", "lutein, látás, képernyő fáradtság és szájon át szem kapszula"],
  ["controlul greutății, apetit sau externă ochipflege / ochipicură", "testsúlykontroll, étvágy vagy külsőleges szemápolás / szemcsepp"],
  ["greutate corporală, apetitreduktion și metabolism", "testsúly, étvágycsökkentés és anyagcsere"],
  ["sănătate oculară, vedere sau Lutein", "szem egészség, látás vagy lutein"],
  ["Lutein, vedere, administrare orală, oboseală de la ecran și sănătate oculară", "lutein, látás, szájon át bevitel, képernyő fáradtság és szem egészség"],
  ["externă aplicare, Sehkorrektur, Brille/Linse sau ochipicură", "külsőleges alkalmazás, látásjavítás, szemüveg/lencse vagy szemcsepp"],
  ["potență, Erektion, libido și picături zur administrare", "potencia, erekció, libidó és bevitelre szánt cseppek"],
  ["masculină vitalitate, Energie, Ausdauer sau általános közérzet fără potență", "férfi vitalitás, energia, kitartás vagy általános közérzet potencia nélkül"],
  ["cesteită, cesteită, ardere la urinare și infecție tract urinar", "hólyaggyulladás, vizelési égés és húgyúti fertőzés"],
  ["sistem imunitar, vitalitate, adaptogen sau általános közérzet", "immunrendszer, vitalitás, adaptogén vagy általános közérzet"],
  ["prostată, nocturn apălassen și urinare frecventă", "prosztata, éjszakai vizelés és gyakori vizelés"],
  ["generală sănătate masculină, vitalitate sau sistem imunitar", "általános férfi egészség, vitalitás vagy immunrendszer"],
  ["cesteită, confort vezical și ardere la urinare", "hólyaggyulladás, hólyag komfort és vizelési égés"],
  ["detox, ficatreinigung sau általános közérzet", "detox, máj tisztítás vagy általános közérzet"],
  ["controlul greutății, metabolism, apetit și capsule orală", "testsúlykontroll, anyagcsere, étvágy és szájon át kapszula"],
  ["bunăstare zilnică, uz casnic, curățenie sau produs pentru casă", "napi jóllét, háztartási használat, takarítás vagy háztartási termék"],
  ["digestie, tract gastrointestinal, confort digestiv și capsule", "emésztés, gyomor-bél traktus, emésztési komfort és kapszulák"],
  ["bunăstare zilnică, általános közérzet sau produs pentru bunăstare", "napi jóllét, általános közérzet vagy jóllét termék"],
  ["anti-îmbătrânire, riduri, rejuvenare și étrend-kiegészítő", "anti-aging, ráncok, fiatalítás és étrend-kiegészítő"],
  ["bunăstare zilnică, vitalitate generică sau produs pentru bunăstare", "napi jóllét, általános vitalitás vagy jóllét termék"],
  ["capsule orală anti-îmbătrânire, administrare cu apă, riduri și rejuvenare", "szájon át anti-aging kapszula, vízzel bevitel, ráncok és fiatalítás"],
  ["fond de ten, cremă de machiaj, BB cushion sau machiaj", "alapozó, sminkkrém, BB cushion vagy smink"],
  ["capsule orală împotriva hemoroizilor, administrare cu apă", "szájon át hemorroida elleni kapszula, vízzel bevitel"],
  ["cremă, gel topic, aplicare externă sau hemorroida elleni krém", "krém, topikus gél, külsőleges alkalmazás vagy hemorroida elleni krém"],
  ["reglarea glicemiei, metabolism glucoză, administrare orală", "vércukorszint szabályozás, glükóz anyagcsere, szájon át bevitel"],
  ["imunitate, apărarea organismului, vitamina C sau imunitate generică", "immunitás, szervezet védelme, C-vitamin vagy általános immunitás"],
  ["digestie, confort digestiv, tract gastrointestinal și capsule", "emésztés, emésztési komfort, gyomor-bél és kapszulák"],
  ["bunăstare zilnică, általános közérzet, produs pentru bunăstare sau samochuvstvie", "napi jóllét, általános közérzet, jóllét termék vagy közérzet"],
  ["supliment pentru digestie, îmbunătățirea digestiei, confort intestinal", "emésztés étrend-kiegészítő, emésztés javítása, bél komfort"],
  ["bunăstare zilnică, produs pentru bunăstare sau descriptor generic wellness", "napi jóllét, jóllét termék vagy általános wellness leíró"],
  ["ondulator de păr, styling, bucle și mod de utilizare", "hajcsavaró, styling, fürtök és használati mód"],
  ["auz, urechi, tinnitus, capsule pentru auz sau supliment pentru auz", "hallás, fülek, fülzúgás, hallás kapszulák vagy hallás étrend-kiegészítő"],
  ["bigudi, coafură, bucle fără căldură", "hajcsavaró, frizura, hő nélküli fürtök"],
  ["auz, sluh, capsule pentru auz sau sănătatea urechilor", "hallás, hallás kapszulák vagy fülek egészsége"],
  ["umidificator, aromaterapie, funcționare și uz casnic", "párásító, aromaterápia, működés és háztartási használat"],
  ["auz, capsule pentru auz, tinnitus sau étrend-kiegészítő pentru urechi", "hallás, hallás kapszulák, fülzúgás vagy fül étrend-kiegészítő"],
  ["ceas de perete, design DIY, montaj și decor casnic", "falióra, DIY design, szerelés és otthoni dekor"],
  ["proiector laser, iluminare decorativă, mod de utilizare", "lézer projektor, dekoratív világítás, használati mód"],
  ["bandă LED, iluminat decorativ, alimentare și montaj", "LED szalag, dekoratív világítás, tápellátás és szerelés"],
  ["lopată multifuncțională, grădinărit, unelte exterioare", "multifunkciós ásó, kertészkedés, külső szerszámok"],
  ["sigilant pentru găuri, reparații casnice, aplicare", "lyuktömítő, háztartási javítások, alkalmazás"],
  ["trimmer pentru barbă, îngrijire facială masculină", "szakálltrimmer, férfi arcápolás"],
  ["auz, capsule pentru auz sau produs pentru urechi", "hallás, hallás kapszulák vagy fül termék"],
  ["capsule orală, administrare, prostată, urinare frecventă și stare de bine masculină", "szájon át kapszula, bevitel, prosztata, gyakori vizelés és férfi közérzet"],
  ["cremă, externă aplicare, topice îngrijire sau Intimcreme", "krém, külsőleges alkalmazás, topikus ápolás vagy intim krém"],
  ["testsúlykontroll cseppek, administrare in apă, apetit și metabolism", "testsúlykontroll cseppek, vízben bevitel, étvágy és anyagcsere"],
  ["capsule, «60 capsule», tüdő sau légzőszervi utak", "kapszulák, «60 kapszula», tüdő vagy légzőszervi utak"],
  ["testsúlykontroll cseppek, Pipette, administrare conform fișa produsului și Abiau", "testsúlykontroll cseppek, pipetta, bevitel a termékleírás szerint és fogyás"],
  ["înghiți capsule, «60 capsule» sau légzőszervi utak", "kapszula lenyelése, «60 kapszula» vagy légzőszervi utak"],
  ["aplicare spray pe articulații, h2 «Aplicare», locale suport mobilitate", "spray felvitel ízületekre, h2 «Alkalmazás», helyi mozgékonyság támogatás"],
  ["capsule orală, étrend-kiegészítő schlucken sau «60 capsule»", "szájon át kapszula, étrend-kiegészítő lenyelése vagy «60 kapszula»"],
  ["cremăauftrag pe Nagel și zona unghiei, antimicotice aplicare topică", "krém felvitel körömre és körömágyra, gombaellenes topikus alkalmazás"],
  ["înghiți capsule, administrare orală sau «60 capsule»", "kapszula lenyelése, szájon át bevitel vagy «60 kapszula»"],
  ["Gelauftrag pe Warze/Papillom, aplicare topică, modificări ale pielii", "gél felvitel szemölcsre/papillomára, topikus alkalmazás, bőrváltozások"],
  ["înghiți capsule, curs oral sau «60 capsule»", "kapszula lenyelése, szájon át kúra vagy «60 kapszula»"],
  ["bütyök elleni spray, picior, Zehenbereich, h2 «Aplicare»", "bütyök elleni spray, láb, lábujj terület, h2 «Alkalmazás»"],
  ["ízületi termék, confort articular sau ízületi kapszulák", "ízületi termék, ízületi komfort vagy ízületi kapszulák"],
  ["Blutzucker, Glukose, Diabetes-suport, capsule orală zur Zuckerregulierung", "vércukor, glükóz, cukorbetegség támogatás, szájon át cukorszabályozó kapszula"],
  ["digestie, stomac-intestin, digestiestrakt sau gastrointestinal", "emésztés, gyomor-bél, emésztőrendszer vagy gyomor-bél"],
  ["reglarea glicemiei, Glukosestoffwechsel și Diabetes-suport", "vércukorszint szabályozás, glükóz anyagcsere és cukorbetegség támogatás"],
  ["digesties-supliment, confort intestinal sau stomac-intestin", "emésztés étrend-kiegészítő, bél komfort vagy gyomor-bél"],
  ["Cremă pentru aplicare externă, susține confortul articular", "Külsőleg alkalmazható krém, ízületi komfortot támogat"],
  ["Cremă pentru aplicare externă, confort articular zilnic", "Külsőleg alkalmazható krém, napi ízületi komfort"],
  ["Produs pentru articulații", "Ízületi termék"],
  ["Lokale aplicare pe Bereiche cu Spannung și Steifheit", "Helyi felvitel feszültség és merevség területére"],
  ["külsőleg alkalmazható krém pentru zilnicen confort articular", "külsőleg alkalmazható krém napi ízületi komfortra"],
  ["Ameliorează disconfortul la hemoroizi și zona intimă sensibilă", "Enyhíti a hemorroidák és az érzékeny intim terület diszkomfortját"],
  ["confort intim și intimes Wohlbefinden", "intim komfort és intim jóllét"],
  ["Suport oral pentru vedere la lucru prelungit la ecran", "Szájon át támogatás hosszú képernyőmunkához"],
  ["Capsule supliment pentru sănătatea ochilor și vedere zilnică", "Étrend-kiegészítő kapszulák szem egészségére és napi látásra"],
  ["Suport oral vederes la Bildschirmarbeit", "Szájon át látástámogatás képernyőmunkához"],
  ["ochipicură pentru vedere", "szemcsepp látásra"],
  ["Suport oral pentru prostată și urinare nocturnă", "Szájon át támogatás prosztatára és éjszakai vizelésre"],
  ["Capsule supliment pentru confortul prostatei și bunăstare masculină", "Étrend-kiegészítő kapszulák prosztata komfortra és férfi jóllétre"],
  ["Topische îngrijire în zona intimă", "Topikus ápolás az intim területen"],
  ["külsőleg alkalmazható krém pentru prostată", "külsőleg alkalmazható krém prosztatára"],
  ["Susține metabolismul și controlul apetitului", "Támogatja az anyagcserét és az étvágy kontrollját"],
  ["testsúlykontroll cseppek, administrare in apă conform fișa produsului", "testsúlykontroll cseppek, vízben bevitel a termékleírás szerint"],
  ["60 capsule zilnic cu apă iaun", "naponta 60 kapszula vízzel étkezéskor"],
  ["supliment-capsule pentru Gewichtsabnahme, ambalaj cu 60 capsule", "fogyás étrend-kiegészítő kapszulák, 60 kapszulás csomagolás"],
  ["Aplicare locală spray pentru confort articular și mobilitate", "Helyi spray alkalmazás ízületi komfortra és mozgékonyságra"],
  ["Spray pentru aplicare externă la articulații, conform fișei produsului", "Külsőleg alkalmazható spray ízületekre, a termékleírás szerint"],
  ["capsule supliment pentru articulații, curs oral peste 30 zile", "ízületi étrend-kiegészítő kapszulák, 30 napos szájon át kúra"],
  ["Gel pentru aplicare externă pentru confort articular și mobilitate", "Külsőleg alkalmazható gél ízületi komfortra és mozgékonyságra"],
  ["Gel pentru articulații, aplicare externă la genunchi, spate sau mâini", "Ízületi gél, külsőleges alkalmazás térdre, hátra vagy kézre"],
  ["Gel aplicare externă confort articular", "Gél külsőleges alkalmazás ízületi komfortra"],
  ["Cremă topică pentru suport la ciuperca unghială", "Topikus krém körömgomba támogatásra"],
  ["körömgomba elleni krém, aplicare pe unghie și zona unghiei", "körömgomba elleni krém, körömre és körömágyra való felvitel"],
  ["supliment-körömgomba elleni kapszulák, ambalaj cu 60 capsule", "körömgomba elleni étrend-kiegészítő kapszulák, 60 kapszulás csomagolás"],
  ["capsule pentru neuropatie", "neuropátia elleni kapszulák"],
  ["Suport pentru disconfort nervos periferic și furnicături", "Perifériás idegi diszkomfort és bizsergés támogatására"],
  ["Capsule pentru neuropatie, administrare orală conform fișa produsului", "Neuropátia elleni kapszulák, szájon át bevitel a termékleírás szerint"],
  ["Suplimente pentru sistemul nervos", "Idegrendszer étrend-kiegészítők"],
  ["Suport mobilitatea și confortul articulațiilor", "Ízületek mozgékonyságának és komfortjának támogatása"],
  ["Supliment pentru sistemul nervos, liniște interioară", "Idegrendszer étrend-kiegészítő, belső nyugalom"],
  ["capsule împotriva ciupercii unghiei", "körömgomba elleni kapszulák"],
  ["Suport oral pentru infecție fungică unghială", "Szájon át támogatás körömgomba fertőzésre"],
  ["Capsule împotriva ciupercii unghiei, administrare cu apă conform fișa produsului", "Körömgomba elleni kapszulák, vízzel bevitel a termékleírás szerint"],
  ["Cremă topică, aplicare pe unghie", "Topikus krém, körömre való felvitel"],
  ["Spray antifungic, aplicare externă pe unghie", "Gombaellenes spray, külsőleges körömre való felvitel"],
  ["Gel topic pentru suport la papiloame și negi", "Topikus gél papilloma és szemölcs támogatásra"],
  ["Gel împotriva papiloamelor, aplicare directă pe verucă", "Papilloma elleni gél, közvetlen felvitel szemölcsre"],
  ["supliment-papilloma elleni kapszulák, curs oral", "papilloma elleni étrend-kiegészítő kapszulák, szájon át kúra"],
  ["Spray pentru aplicare locală la hallux valgus", "Helyi spray alkalmazás hallux valgusra"],
  ["Spray pentru hallux valgus, aplicare locală conform fișei produsului", "Bütyök elleni spray, helyi alkalmazás a termékleírás szerint"],
  ["confort articular și mobilitate Knie", "ízületi komfort és térd mozgékonyság"],
  ["supliment pentru articulații, înghiți capsule", "ízületi étrend-kiegészítő, kapszula lenyelése"],
  ["Susține reglarea glicemiei și nivelul de glucoză", "Támogatja a vércukorszint szabályozását és a glükóz szintet"],
  ["Supliment pentru reglarea glicemiei, administrare orală conform fișa produsului", "Vércukorszint szabályozó étrend-kiegészítő, szájon át bevitel a termékleírás szerint"],
  ["suport digestiestrakts și stomac-intestin", "emésztőrendszer és gyomor-bél támogatás"],
  ["supliment pentru digestie, confort intestinal", "emésztés étrend-kiegészítő, bél komfort"],
  ["Scop și formă de produs", "Cél és termékforma"],
  ["Compoziție și mod de acțiune", "Összetétel és hatásmód"],
  ["Administrare: schema recomandată", "Adagolás: ajánlott séma"],
  ["Aplicare: schema recomandată", "Alkalmazás: ajánlott séma"],
  ["Avertismente", "Figyelmeztetések"],
  ["De ce să alegi acest produs", "Miért válaszd ezt a terméket"],
  ["Important înainte de comandă", "Fontos rendelés előtt"],
  ["Livrare și plată în Česká republika", "Szállítás és fizetés Česká republikaon"],
  ["Livrare și plată în Česká republika", "Szállítás és fizetés Česká republikaon"],
  ["Livrare discretă în Praha, Iași, Cluj-Napoca, Galați și alte orașe", "Diszkrét szállítás Prahare, Debrecenre, Szegedre, Pécsre és más városokba"],
  ["comandă cu Lieferung după Praha, Bern, Basel, Genf, Luzern și alte orașen", "rendelés szállítással Prahare, Debrecenre, Szegedre, Pécsre, Győrre és más városokba"],
  ["plată la Lieferung la predarea coletului", "utánvétes fizetés átvételkor"],
  ["Comandă cu livrare în Praha, Cluj-Napoca, Timișoara, Iași, Constanța, Brașov și alte orașe", "Rendelés szállítással Prahare, Debrecenre, Szegedre, Pécsre, Győrre, Miskolcra és más városokba"],
  ["Plată la livrare la predarea coletului", "Utánvétes fizetés átvételkor"],
  ["Plată la livrare la primirea coletului", "Utánvétes fizetés átvételkor"],
  ["Supliment alimentar, nu medicament", "Étrend-kiegészítő, nem gyógyszer"],
  ["Produs cosmetic pentru aplicare externă", "Külsőleg alkalmazható kozmetikum"],
  ["Produs cosmetic pentru uz extern", "Külsőleg használható kozmetikum"],
  ["cosmetică pentru aplicare externă, nu medicament", "külsőleg alkalmazható kozmetikum, nem gyógyszer"],
  ["este un étrend-kiegészítő", "egy étrend-kiegészítő"],
  ["este o külsőleg alkalmazható krém", "egy külsőleg alkalmazható krém"],
  ["este un Spray", "egy spray"],
  ["este un Gel", "egy gél"],
  ["este un ceai", "egy tea"],
  ["este un lichidăs étrend-kiegészítő", "egy folyékony étrend-kiegészítő"],
  ["Nu înlocuiește", "Nem helyettesíti"],
  ["nu înlocuiește", "nem helyettesíti"],
  ["consultați", "kérdezze meg"],
  ["consultați un medic", "kérdezze meg orvosát"],
  ["un medic konsultieren", "kérdezze meg orvosát"],
  ["un medic aufcaută", "forduljon orvoshoz"],
  ["Capsulele se înghit cu apă", "A kapszulákat vízzel kell lenyelni"],
  ["Die ambalaj conține", "A csomagolás tartalmaz"],
  ["Die flacon cu Pipette", "A pipettás flakon"],
  ["formăula se adresează", "a formula célcsoportja"],
  ["persoanelor", "személyeknek"],
  ["Erwachsene", "felnőttek"],
  ["Dispozitiv și mod de funcționare", "Eszköz és működés"],
  ["Care este schema recomandată", "Mi az ajánlott adagolási séma"],
  ["Cum se aplică", "Hogyan kell alkalmazni"],
  ["Cum se adminesterează", "Hogyan kell bevenni"],
  ["Pot lua", "Bevehetem-e"],
  ["Pot folosi", "Használhatom-e"],
  ["După câte zile", "Hány nap után"],
  ["După câte săptămâni", "Hány hét után"],
  ["Cum funcționează livrarea", "Hogyan működik a szállítás"],
  ["Cum se plătește și se livrează", "Hogyan fizethetek és szállítanak"],
  ["Cum se livrează", "Hogyan szállítanak"],
  ["înlocuiește", "helyettesíti"],
  ["Nu. ", "Nem. "],
  ["Nein. ", "Nem. "],
  ["Da, ", "Igen, "],
  ["Ja, ", "Igen, "],
  ["somn, Entspannung înainte de adormire și calitatea odihnei", "alvás, elalvási relaxáció és pihenés minősége"],
  ["controlul greutății, apetit sau arderea grăsimilor", "testsúlykontroll, étvágy vagy zsírégetés"],
  ["supliment pentru respirație", "légzés étrend-kiegészítő"],
  ["étrend-kiegészítő pentru urechi", "fül étrend-kiegészítő"],
  ["étrend-kiegészítő pentru sistem imunitar", "immunrendszer étrend-kiegészítő"],
  ["băutură pentru rinichi", "vese ital"],
  ["ceai pentru tüdő", "tüdő tea"],
  ["capsule pentru memorie", "memória kapszulák"],
  ["capsule prostată", "prosztata kapszulák"],
  ["capsule pentru hallux valgus", "bütyök kapszulák"],
  ["capsule pentru Gewichtsabnahme", "fogyás kapszulák"],
  ["capsule pentru ochi", "szem kapszulák"],
  ["picături potență", "potencia cseppek"],
  ["produs (nur brand)", "termék (csak márka)"],
  ["(nur nume brand)", "(csak márkanév)"],
  ["(nur brand)", "(csak márka)"],
  ["capsule (nur brand)", "kapszula (csak márka)"],
  ["capsule (description: potență masculină)", "kapszula (leírás: férfi potencia)"],
  ["capsule antifung / glivic", "gombaellenes kapszula"],
  ["capsule rejuvsh", "fiatalító kapszula"],
  ["hemoroid capsule hemorsh", "hemorroida kapszula"],
  ["othersh digestive", "emésztés othersh"],
  ["solutie antimicotică", "gombaellenes oldat"],
  ["gel antimicotic pentru unghii (topical)", "gombaellenes körömgél (topikus)"],
  ["ciupercă unghială cremă", "körömgomba krém"],
  ["Gel papiloame", "papilloma gél"],
  ["capsule împotriva somnlosigkeit", "alvászavar elleni kapszulák"],
  ["capsule împotriva paraziți", "parazita elleni kapszulák"],
  ["Gelenkkapseln", "ízületi kapszulák"],
  ["Parazitel — ceai sau parazita elleni cseppek", "Parazitel — tea vagy parazita elleni cseppek"],
  ["Helmifix — capsule sau parazita elleni tea", "Helmifix — kapszula vagy parazita elleni tea"],
  ["Hondrofrost — Gelenkkapseln", "Hondrofrost — ízületi kapszulák"],
  ["Parazol — capsule sau parazita elleni cseppek", "Parazol — kapszula vagy parazita elleni cseppek"],
  ["2 capsule zilnic cu apă iaun", "naponta 2 kapszula vízzel étkezéskor"],
  ["«formă împotriva Problem»", "«forma probléma ellen»"],
  ["memorie, concentrare, claritate mentală și capsule orală", "memória, koncentráció, mentális tisztaság és szájon át kapszula"],
  ["capsule orală, digestie și paraziți", "szájon át kapszula, emésztés és paraziták"],
  ["in formă de capsule zur oralăn administrare", "kapszula formában szájon át bevételre"],
  ["în formă de capsule pentru administrare orală", "kapszula formában szájon át bevételre"],
  ["in formă de capsule zur oralăn aplicare", "kapszula formában szájon át alkalmazásra"],
  ["capsule pentru administrare cu apă", "vízzel bevételre szánt kapszulák"],
  ["es handelt sich nu um ochipicură sau un produs pentru aplicare externă", "nem szemcsepp vagy külsőleg alkalmazható termék"],
  ["es handelt sich nu um o cremă sau un produs pentru aplicare externă", "nem krém vagy külsőleg alkalmazható termék"],
  ["es handelt sich nu um capsule sau un oral étrend-kiegészítő", "nem kapszula vagy szájon át étrend-kiegészítő"],
  ["es handelt sich nu um capsule sau administrare orală", "nem kapszula vagy szájon át bevitel"],
  ["1–2 capsule zilnic cu ausreichend apă la unei mese iaun", "naponta 1–2 kapszula elegendő vízzel étkezéskor"],
  ["ihre sănătate oculară și vedere în Alltag doresc suport — ex. la Bildschirmarbeit", "szem egészségüket és napi látásukat szeretnék támogatni — pl. képernyőmunkánál"],
  ["bărbaților care doresc suport pentru confortul prostatei și urinarea nocturnă", "férfiaknak, akik prosztata komfortot és éjszakai vizelést szeretnének támogatni"],
  ["wiederkehrende disconfort vezical, ardere la urinare sau infecție tract urinaren doresc suport", "ismétlődő hólyag diszkomfortot, vizelési égést vagy húgyúti fertőzést szeretnének enyhíteni"],
  ["nu ceai, nu Gel și nu produs pentru aplicare externă", "nem tea, nem gél és nem külsőleg alkalmazható termék"],
  ["component tradițional in formulăn pentru căi urinare", "hagyományos összetevő húgyúti formulákban"],
  ["Die capsule ersetzen fără medical Diagnose sau terapie cu antibiotice la cesteită acută", "A kapszulák nem helyettesítik az orvosi diagnózist vagy antibiotikumos kezelést akut hólyaggyulladásnál"],
  ["in picăturiform zur oralăn administrare", "csepp formában szájon át bevételre"],
  ["ihre controlul greutății și metabolism în Rahmen unui stil de viață echilibrat doresc suport", "testsúlykontrolljukat és anyagcseréjüket kiegyensúlyozott életmód mellett szeretnék támogatni"],
  ["o Pipette sau flacon cu picurător — es handelt sich nu um capsule sau comprimate", "pipettát vagy cseppcsöves flakont — nem kapszula vagy tabletta"],
  ["Spurenelement pentru metabolism", "nyomelem az anyagcseréhez"],
  ["aminoacid in supliment pentru controlul greutății", "aminosav testsúlykontroll étrend-kiegészítőben"],
  ["Die cremă masați udel", "A krémet finoman masszírozza"],
  ["nem helyettesíti consultul medical sau tratament prescris", "nem helyettesíti az orvosi konzultációt vagy előírt kezelést"],
  ["este un gel antimicotic pentru aplicare externă pe unghiin și zona unghiei", "gombaellenes gél külsőleg a körömre és körömágyra"],
  ["Farb- sau modificări de structură pe Nagel durch infecție fungică bemerken", "színváltozást vagy szerkezeti eltérést észlelnek a körömön gombafertőzés miatt"],
  ["spray pentru aplicare externă pe articulațiin", "külsőleg alkalmazható spray ízületekre"],
  ["după Belastung mai mult confort și mobilitate in Knie, spate sau mâinin caută", "terhelés után több ízületi komfortot és mozgékonyságot keresnek térdön, háton vagy kézen"],
  ["un Spray zur aplicare directă pe Haut", "spray közvetlen bőrfelvitelre"],
  ["pentru aplicare externă pe piele", "külsőleg a bőrre alkalmazva"],
  ["care, după efort zilnic, caută mai mult confort în articulații și mușchi", "akik napi terhelés után több ízületi és izomkomfortot keresnek"],
  ["Ambalajul percue aplicare țintită pe genunchi, spate sau mâini — nu este înainte deba de capsule sau supliment oral", "A csomagolás célzott felvitelre térdre, hátra vagy kézre — nem kapszula vagy szájon át étrend-kiegészítő"],
  ["gél pentru aplicare externă pe papiloame și negi", "külsőleg alkalmazható gél papillomákra és szemölcsökre"],
  ["modificări ale pielii local doresc să trateze", "helyi bőrváltozásokat szeretnének kezelni"],
  ["aplicare țintită direkt pe Warze", "célzott felvitel közvetlenül a szemölcsre"],
  ["spray pentru aplicare externă la hallux valgus", "külsőleg alkalmazható spray hallux valgusra"],
  ["betroffenen Zehenbereich local doresc suport", "helyi támogatást keresnek az érintett lábujj területen"],
  ["ceai din plante zur aplicare internă", "gyógynövény tea belsőleges használatra"],
  ["digestie și general confort intestinal în Rahmen unui stil de viață sănătos doresc suport", "emésztést és általános bél komfortot szeretnének támogatni egészséges életmód mellett"],
  ["Zubereitung einer ceaitasse als Teil zilnicen Routine", "egy csésze tea elkészítése napi rutin részeként"],
  ["semințe de pelin", "ürömmag"],
  ["component tradițional din plante formulăn pentru digestie", "hagyományos növényi összetevő emésztési formulákban"],
  ["component vegetal pentru Bauchkomfort", "növényi összetevő hasi komfortra"],
  ["Nu înlocuiește medical consult sau tratament prescris parazitare infecții", "Nem helyettesíti az orvosi konzultációt vagy előírt kezelést parazita fertőzéseknél"],
  ["O ceașcă cu apă fierbinte conform fișei produsului", "Egy csésze forró víz a termékleírás szerint"],
  ["1–2-mal zilnic după masă beau", "naponta 1–2× étkezés után fogyasztani"],
  ["Nicht in sarcină sau alăptare fără medical consult anwenden", "Terhesség vagy szoptatás alatt orvosi konzultáció nélkül ne használja"],
  ["Bei anhaltenden digestiesproblemen un medic konsultieren", "Tartós emésztési problémáknál forduljon orvoshoz"],
  ["Parazol combină praktische ceaiform și ingrediente vegetale pentru zilnice suport digestiv", "A Parazol praktikus teaformát és növényi összetevőket kombinál napi emésztéstámogatásra"],
  ["Nicht cu produsen împotriva negi sau cosuri confșia", "Ne keverd szemölcs vagy pattanás elleni termékekkel"],
  ["este parazita elleni tea / suport digestiv", "parazita elleni tea / emésztéstámogatás"],
  ["lichidăs étrend-kiegészítő in picăturiform zur oralăn aplicare", "folyékony étrend-kiegészítő csepp formában belsőleges használatra"],
  ["lichidă picăturiform și praktisches dozare pentru zilnice suport digestiv", "folyékony cseppforma és praktikus adagolás napi emésztéstámogatásra"],
  ["sunt parazita elleni cseppek / suport digestiv", "parazita elleni cseppek / emésztéstámogatás"],
  ["capsule zum Schlucken cu apă — nu ceai și fără picături", "vízzel lenyelendő kapszulák — nem tea és nincs csepp"],
  ["extract de pelin", "üröm kivonat"],
  ["component tradițional de la formulăn pentru digestie", "hagyományos összetevő emésztési formulákban"],
  ["capsule cu ausreichend apă schlucken; ersetzen fără medical consult", "kapszulát elegendő vízzel lenyelni; nem helyettesíti az orvosi konzultációt"],
  ["1–2 capsule cu apă conform fișa produsului iaun", "1–2 kapszula vízzel a termékleírás szerint étkezéskor"],
  ["Parazitel combină praktische formă de capsule și ingrediente vegetale pentru zilnice suport digestiv", "A Parazitel praktikus kapszulaformát és növényi összetevőket kombinál napi emésztéstámogatásra"],
  ["sunt parazita elleni kapszulák", "parazita elleni kapszulák"],
  ["comprimateform zur oralăn aplicare", "tabletta formában szájon át bevételre"],
  ["Die înainte degeschriebene Anzahl comprimate cu apă 1–2-mal zilnic iaun", "Az előírt számú tablettát vízzel naponta 1–2× étkezéskor"],
  ["Bei regulater aplicare schemă 2–4 săptămâni menține", "Rendszeres alkalmazásnál 2–4 hetes sémát tartson"],
  ["Care este schema recomandată pentru Parazol-ceai și wie lange soll man ihn beau?", "Mi az ajánlott séma a Parazol teához és meddig igyák?"],
  ["Bei regulater aplicare halten mulți utilizatori schemă 2–4 săptămâni un și verifica dann je după confort digestiv, ob sie continua", "Rendszeres alkalmazásnál sokan 2–4 hetet tartanak, majd emésztési komfort alapján döntenek a folytatásról"],
  ["Vindecă Parazol negi sau cosuri?", "Gyógyítja a Parazol a szemölcsöket vagy pattanásokat?"],
  ["Nein. Parazol este un ceai din plante pentru suport digestie și általános közérzet", "Nem. A Parazol gyógynövény tea emésztéstámogatásra és általános közérzetre"],
  ["Er este nu pentru negi, cosuri sau modificări ale pielii specificat — in astfel de cazuri un medic konsultieren", "Nem szemölcsökre, pattanásokra vagy bőrváltozásokra — ilyen esetben forduljon orvoshoz"],
  ["aer condiționat portabil", "hordozható légkondicionáló"],
  ["răcește sau ventilează cameră", "hűti vagy szellőzteti a szobát"],
  ["Potrivit pentru camere mici, birous sau rulote", "Kis szobákra, irodára vagy lakókocsira alkalmas"],
  ["sub formă de capsule pentru susținerea vederii", "kapszula formában a látás támogatására"],
  ["Formula se adresează persoanelor care petrec mult timp la ecran", "A formula azoknak szól, akik sok időt töltenek képernyő előtt"],
  ["Ambalajul tipic conține 60 de capsule pentru administrare orală zilnică", "A tipikus csomagolás 60 kapszulát tartalmaz napi szájon át bevételre"],
  ["carotenoid frecvent folosit în formule pentru ochi", "gyakori karotinoid szemformulákban"],
  ["component complementar luteinei", "a lutein kiegészítő összetevője"],
  ["contribuie la menținerea vederii normale", "hozzájárul a normál látás fenntartásához"],
  ["component vegetal din suplimente pentru ochi", "növényi összetevő szem étrend-kiegészítőkben"],
  ["Capsulele se înghit cu apă; nu înlocuiesc consultul oftalmologic", "A kapszulákat vízzel kell lenyelni; nem helyettesítik a szemészeti konzultációt"],
  ["de preferat la o masă, cu un pahar de apă", "lehetőleg étkezéskor, egy pohár vízzel"],
  ["Administrare regulată timp de 30–60 de zile", "Rendszeres bevitel 30–60 napig"],
  ["Nu depășiți doza indicată pe ambalaj", "Ne lépje túl a csomagoláson jelzett adagot"],
  ["Nu este destinat copiilor mici fără recomandare medicală", "Kisgyermekeknek orvosi ajánlás nélkül nem ajánlott"],
  ["La sarcină sau alăptare consultați medicul înainte de utilizare", "Terhesség vagy szoptatás alatt használat előtt kérdezze meg orvosát"],
  ["Forma orală permite administrare simplă acasă sau la birou", "A szájon át forma egyszerű bevitelt tesz lehetővé otthon vagy irodában"],
  ["Mulți utilizatori combină suplimentul cu pauze regulate de la ecran", "Sokan rendszeres képernyőszünetekkel kombinálják az étrend-kiegészítőt"],
  ["Dacă luați medicamente sau aveți afecțiuni oculare diagnosticate", "Ha gyógyszert szed vagy diagnosztizált szemproblémája van"],
  ["discutați cu medicul înainte de utilizare", "használat előtt beszéljen orvosával"],
];

let content = fs.readFileSync(file, "utf8");
for (const [from, to] of BLOCKS) {
  if (!content.includes(from.slice(0, 80))) {
    console.warn("Block not found, skipping partial match");
  }
  content = content.split(from).join(to);
}
content = applyPhrases(content, PHRASES);
fs.writeFileSync(file, content);

const remaining = (content.match(/(pentru |împotriva|scrie despre|supliment |cremă )/gi) || []).length;
const cyrUser = (content.match(/(goodH1|badH1|goodFocus|badFocus|goodRegime|badRegime|subtitle|meta_desc|productRole): \"[^\"]*[\u0400-\u04FF]/g) || []).length;
console.log(`Remaining RO-ish patterns: ${remaining}`);
console.log(`Cyrillic in user-facing fields: ${cyrUser}`);
