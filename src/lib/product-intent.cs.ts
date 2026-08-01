/** Title-first catalog shelf intent (HU) — product type from feed title, not broad feed bucket. */

import { splitBrandAndTail } from "./brand-clean";
import {
  inferShakesLandingTokenSlug,
} from "./shakes-landing-tokens.cs";
import { getCategoryDescriptor } from "./category-descriptors.cs";
import { buildShelfClassificationGuideCS } from "./shelf-classification.examples.cs";
import { buildShelfDisambiguationGuideCS } from "./shelf-disambiguation.cs";
import { SPECIFIC_MEDICAL_SLUGS } from "./problem-vocabulary.cs";

export type IntentBucketConflict = {
  titleCue: string;
  intentSlug: string;
  badBucket: string;
  badSlug: string;
};

/** Generic feed-bucket conflicts (role lexicon, no brand names). */
export const INTENT_BUCKET_CONFLICTS: IntentBucketConflict[] = [
  {
    titleCue: "liver / hepatic / liver support / jetra detox",
    intentSlug: "jatra",
    badBucket: "Paraziták (általános bucket)",
    badSlug: "paraziti",
  },
  {
    titleCue: "diabetes / glucose / glycemia / insulin support",
    intentSlug: "cukrovka",
    badBucket: "Paraziták (általános bucket)",
    badSlug: "paraziti",
  },
  {
    titleCue: "rodent repellent / ultrasonic pest / odstraszanie gryzoni",
    intentSlug: "zahradni-naradi",
    badBucket: "Paraziták (általános bucket)",
    badSlug: "paraziti",
  },
  {
    titleCue: "menstrual cup / kubeczek menstruacyjny",
    intentSlug: "zdravi-zen",
    badBucket: "Felnőttek / potencia",
    badSlug: "potence",
  },
  {
    titleCue: "nasal corrector / nose clip / nose shape",
    intentSlug: "kosmeticke-nastroje",
    badBucket: "Növelés (általános)",
    badSlug: "zvetseni-penisu",
  },
  {
    titleCue: "urinary / cystitis / piekące oddawanie moczu",
    intentSlug: "cystitida",
    badBucket: "Nők / szépség (általános)",
    badSlug: "zdravi-zen",
  },
  {
    titleCue: "prostate / prostatitis / męskie oddawanie moczu",
    intentSlug: "prostata",
    badBucket: "Nők / hólyaggyulladás",
    badSlug: "zdravi-zen",
  },
  {
    titleCue: "potency / libido / hyperpotency",
    intentSlug: "potence",
    badBucket: "Magas vérnyomás / hólyaggyulladás",
    badSlug: "krevni-tlak",
  },
  {
    titleCue: "CPA TL Нутра: гипертония + description/landing cu potență / erecție",
    intentSlug: "potence",
    badBucket: "Nutra: hipertónia (CPA TL nutra sáv)",
    badSlug: "krevni-tlak",
  },
  {
    titleCue: "CPA TL Нутра: потенция + description cu tensiune / cardiovascular",
    intentSlug: "krevni-tlak",
    badBucket: "Nutra: potencia (CPA TL nutra sáv)",
    badSlug: "potence",
  },
  {
    titleCue: "potency / erection / męska libido",
    intentSlug: "potence",
    badBucket: "Hemorroidák",
    badSlug: "hemoroidy",
  },
  {
    titleCue: "hemorrhoids / proctonic / rectosave",
    intentSlug: "hemoroidy",
    badBucket: "Potencia / hiperpotencia",
    badSlug: "potence",
  },
  {
    titleCue: "hypertension / blood pressure",
    intentSlug: "krevni-tlak",
    badBucket: "Hiperpotencia / potencia",
    badSlug: "potence",
  },
  {
    titleCue: "anti-aging / wrinkles / facial rejuvenation",
    intentSlug: "anti-aging",
    badBucket: "Növelés / szépség",
    badSlug: "zvetseni-penisu",
  },
  {
    titleCue: "clothes / clothing / dresses",
    intentSlug: "obleceni",
    badBucket: "Cipő",
    badSlug: "boty",
  },
  {
    titleCue: "parasites / antiparasitic / anthelmintic / Parazol / herbata przeciw pasożytom",
    intentSlug: "paraziti",
    badBucket: "Paraziták, szemölcsök",
    badSlug: "papilomy",
  },
  {
    titleCue: "papillomas / papilloma / wart remover",
    intentSlug: "papilomy",
    badBucket: "Paraziták (általános bucket)",
    badSlug: "paraziti",
  },
  {
    titleCue: "digestion / gastrointestinal tract / trawienie",
    intentSlug: "traveni",
    badBucket: "Paraziták (általános bucket)",
    badSlug: "paraziti",
  },
  {
    titleCue: "Toxic OFF / Detoxic / antiparasitic / toxofil",
    intentSlug: "paraziti",
    badBucket: "GI / emésztés",
    badSlug: "traveni",
  },
  {
    titleCue: "bra / push-up / flybra",
    intentSlug: "obleceni",
    badBucket: "Háztartási cikkek / felnőttek",
    badSlug: "domaci-vychytavky",
  },
  {
    titleCue: "glucose / sugar / diabetes / glycemic control / InsuLevel / Balansulin",
    intentSlug: "cukrovka",
    badBucket: "Emésztés / GI",
    badSlug: "traveni",
  },
  {
    titleCue: "glucose / sugar / diabetes / glycemic control",
    intentSlug: "cukrovka",
    badBucket: "«automatic» a leíróban (nem autó)",
    badSlug: "autodoplnky",
  },
  {
    titleCue: "automatic / automatic w suplemencie lub metabolizmie",
    intentSlug: "cukrovka",
    badBucket: "Autó / autóhoz",
    badSlug: "autodoplnky",
  },
  {
    titleCue: "Auto / vehicle / windshield / parking sensor / DVR",
    intentSlug: "autodoplnky",
    badBucket: "Étrend-kiegészítők / cukorbetegség",
    badSlug: "cukrovka",
  },
  {
    titleCue: "detox / toxins / body cleanse",
    intentSlug: "detox",
    badBucket: "Autó / autóhoz",
    badSlug: "autodoplnky",
  },
  {
    titleCue: "sleep / insomnia / melatonin / bezsenność",
    intentSlug: "chrapani",
    badBucket: "Fogyókúra / testsúlycsökkentés",
    badSlug: "hubnuti",
  },
  {
    titleCue: "memory / pamięć / cognitive / brain support",
    intentSlug: "stres",
    badBucket: "Fogyókúra / testsúlycsökkentés",
    badSlug: "hubnuti",
  },
  {
    titleCue: "kidney / nefro / renal / nerki support",
    intentSlug: "ledviny",
    badBucket: "Hólyaggyulladás / cystitis",
    badSlug: "cystitida",
  },
  {
    titleCue: "Wormax / antiparasitic capsules / przeciw pasożytom",
    intentSlug: "paraziti",
    badBucket: "Szemölcsök (általános bucket)",
    badSlug: "papilomy",
  },
  {
    titleCue: "joints / stawy / arthritis / glucosamine",
    intentSlug: "klouby",
    badBucket: "Máj / liver-health",
    badSlug: "jatra",
  },
  {
    titleCue: "Para Clean / antiparasitic capsules in household bucket",
    intentSlug: "paraziti",
    badBucket: "Otthon / household",
    badSlug: "domaci-potreby",
  },
  {
    titleCue: "memory / pamięć / cognitive in detox bucket",
    intentSlug: "stres",
    badBucket: "Detox / tisztítás",
    badSlug: "detox",
  },
  {
    titleCue: "grass/lawn/hedge trimmer / strimmer / garden tool",
    intentSlug: "zahradni-naradi",
    badBucket: "Szépség / personal-grooming",
    badSlug: "osobni-pece",
  },
  {
    titleCue: "NOKTAL / antifungal gel / roztwór przeciwgrzybiczy",
    intentSlug: "plisen-nehtu",
    badBucket: "Anti-aging / öregedésgátlás",
    badSlug: "anti-aging",
  },
  {
    titleCue: "Deep Inhale / lung tea / płuca / układ oddechowy",
    intentSlug: "dychaci-cesty",
    badBucket: "Idegrendszer / nervous-system",
    badSlug: "stres",
  },
  {
    titleCue: "ZFimuno / immunity / układ odpornościowy / vitamin C+D+zinc",
    intentSlug: "imunita",
    badBucket: "Idegrendszer / nervous-system",
    badSlug: "stres",
  },
  {
    titleCue: "weight loss / abnehmen / gewicht / odchudzanie / fat burn",
    intentSlug: "hubnuti",
    badBucket: "Légúti / respiratory",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "snoring / schnarchen / anti-snoring / храп",
    intentSlug: "chrapani",
    badBucket: "Fogyókúra / testsúlycsökkentés",
    badSlug: "hubnuti",
  },
  {
    titleCue: "eye / vision / augen / sehkraft / ocular / lutein",
    intentSlug: "zrak",
    badBucket: "Fogyókúra / testsúlycsökkentés",
    badSlug: "hubnuti",
  },
  {
    titleCue: "smoking / kajenje / rauch / nicotin",
    intentSlug: "odvykani-koureni",
    badBucket: "Légúti / respiratory-health",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "alcohol / alkohol / alkoholizm",
    intentSlug: "alkoholismus",
    badBucket: "Légúti / respiratory-health",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "proti hemoroidom / hemorrhoids / hemoroid (landing tail)",
    intentSlug: "hemoroidy",
    badBucket: "Légúti / respiratory-health",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "papilomi / papillomas / borodav / hpv (landing tail)",
    intentSlug: "papilomy",
    badBucket: "Légúti / respiratory-health",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "alkohol / alcohol / odvisnost (landing tail, Reishield/Cordyceps SKU)",
    intentSlug: "alkoholismus",
    badBucket: "Légúti / respiratory-health",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "sluh / hearing / za sluh (landing tail)",
    intentSlug: "sluch",
    badBucket: "Légúti / respiratory-health",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "spomin / memory / cognitive / memorsh landing",
    intentSlug: "stres",
    badBucket: "Idegrendszer / nervous-system (anti-stress sztereotípia)",
    badSlug: "stres",
  },
  {
    titleCue: "neuropat / neuropathy / neurosh landing",
    intentSlug: "stres",
    badBucket: "Idegrendszer / nervous-system (anti-stress sztereotípia)",
    badSlug: "stres",
  },
  {
    titleCue: "car cleaner / curățător auto / сухой очиститель / автомобил",
    intentSlug: "autodoplnky",
    badBucket: "Hallás / hearing",
    badSlug: "sluch",
  },
  {
    titleCue: "fond de ten / BB cushion / Venzen / makeup cushion / eyebrow powder",
    intentSlug: "anti-aging",
    badBucket: "Hallás / hearing",
    badSlug: "sluch",
  },
  {
    titleCue: "curling iron / hair styler / LED face mask / brow powder",
    intentSlug: "osobni-pece",
    badBucket: "Hallás / vision-eye-care",
    badSlug: "sluch",
  },
  {
    titleCue: "плойка / бигуди / завивк / beard trimmer / триммер для бороды",
    intentSlug: "osobni-pece",
    badBucket: "Hallás / KMA hallás bucket",
    badSlug: "sluch",
  },
  {
    titleCue: "liquid tights / колготки / leggings / shapewear",
    intentSlug: "obleceni",
    badBucket: "Hallás / hearing",
    badSlug: "sluch",
  },
  {
    titleCue: "teeth whitening / отбеливание зубов / whitening pen",
    intentSlug: "osobni-pece",
    badBucket: "Hallás / hearing",
    badSlug: "sluch",
  },
  {
    titleCue: "humidifier / увлажнитель / aroma diffuser / AirCalm",
    intentSlug: "domaci-klima",
    badBucket: "Hallás / hearing",
    badSlug: "sluch",
  },
  {
    titleCue: "makeup brush cleaner / косметические кисти",
    intentSlug: "kosmeticke-nastroje",
    badBucket: "Hallás / hearing",
    badSlug: "sluch",
  },
  {
    titleCue: "knee brace / kneepad / genunchier / наколенник",
    intentSlug: "klouby",
    badBucket: "Vérnyomás / blood-pressure",
    badSlug: "krevni-tlak",
  },
  {
    titleCue: "Rhino Correct / nose clip / nasal corrector",
    intentSlug: "kosmeticke-nastroje",
    badBucket: "Háztartási kütyük / home-gadgets",
    badSlug: "domaci-vychytavky",
  },
  {
    titleCue: "testosterone / testosteron boost",
    intentSlug: "potence",
    badBucket: "Háztartási / household",
    badSlug: "domaci-potreby",
  },
  {
    titleCue: "Vermixin / Cleorix / antiparasitic cleanse",
    intentSlug: "paraziti",
    badBucket: "Immunitás / immunity",
    badSlug: "imunita",
  },
  {
    titleCue: "DM-Norm / glucose / glycemia / Blutzucker / glicemie",
    intentSlug: "cukrovka",
    badBucket: "Immunitás / immunity",
    badSlug: "imunita",
  },
  {
    titleCue: "Gigant gel / penis enlargement gel",
    intentSlug: "zvetseni-penisu",
    badBucket: "Potencia / potence-libido",
    badSlug: "potence",
  },
  {
    titleCue: "weight loss / abiau / balancioloss (landing tail)",
    intentSlug: "hubnuti",
    badBucket: "Háztartási / household",
    badSlug: "domaci-potreby",
  },
  {
    titleCue: "weight loss / abiau / balancioloss (landing tail)",
    intentSlug: "hubnuti",
    badBucket: "Jólét termék",
    badSlug: "other",
  },
  {
    titleCue: "Verdauung / digest / gastrointestinal (landing tail, othersh)",
    intentSlug: "traveni",
    badBucket: "Háztartási / household",
    badSlug: "domaci-potreby",
  },
  {
    titleCue: "Verdauung / digest / gastrointestinal (landing tail, othersh)",
    intentSlug: "traveni",
    badBucket: "Jólét termék",
    badSlug: "other",
  },
  {
    titleCue: "rejuvsh / rejuvenation / anti-aging (landing tail)",
    intentSlug: "anti-aging",
    badBucket: "Háztartási / household",
    badSlug: "domaci-potreby",
  },
  {
    titleCue: "rejuvsh / rejuvenation / anti-aging (landing tail)",
    intentSlug: "anti-aging",
    badBucket: "Jólét termék",
    badSlug: "other",
  },
  {
    titleCue: "multi-SKU Cordyceps/Benaga/Reishield/Neoflorax/Balancio in household bucket",
    intentSlug: "varies-by-landing",
    badBucket: "Háztartási / household — olvasd a landing URL-t",
    badSlug: "domaci-potreby",
  },
  {
    titleCue: "multi-SKU brand-only title in other / bunăstare bucket",
    intentSlug: "varies-by-landing",
    badBucket: "Jólét termék",
    badSlug: "other",
  },
  {
    titleCue: "portable heater / USB vacuum / electrocasnic compact",
    intentSlug: "domaci-vychytavky",
    badBucket: "Hallás / respiratory",
    badSlug: "sluch",
  },
  {
    titleCue: "shujšanje / hujšanje / weight loss / abnehmen (landing tail)",
    intentSlug: "hubnuti",
    badBucket: "Légúti / respiratory-health",
    badSlug: "dychaci-cesty",
  },
  {
    titleCue: "Hondro G/M + valgus / hallux / spray",
    intentSlug: "vboceny-palec",
    badBucket: "Ízületek / joint-care",
    badSlug: "klouby",
  },
  {
    titleCue: "Motion Mat / massage mat",
    intentSlug: "domaci-vychytavky",
    badBucket: "Vérnyomás / blood-pressure",
    badSlug: "krevni-tlak",
  },
  {
    titleCue: "Talorix / potency drops / Potenz",
    intentSlug: "potence",
    badBucket: "általános férfi vitalitás",
    badSlug: "potence",
  },
  {
    titleCue: "Cortitron + joints / sklepe / stawy",
    intentSlug: "klouby",
    badBucket: "Intim komfort / hemorrhoids SKU",
    badSlug: "hemoroidy",
  },
  {
    titleCue: "Cortitron + weight / abnehmen / odchudzanie",
    intentSlug: "hubnuti",
    badBucket: "Intim komfort / hemorrhoids SKU",
    badSlug: "hemoroidy",
  },
  {
    titleCue: "Proctonic cream / hemorrhoids topical",
    intentSlug: "hemoroidy",
    badBucket: "Potencia / potence-libido",
    badSlug: "potence",
  },
];

/**
 * Title-first role patterns — lexicon only, ordered narrow → broad.
 * Exported for classify.ts (single source).
 */
export const INTENT_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /\bpest\s*reject\b|pest\s*repell|ultrasonic\s*(?:rodent|pest)|rodent\s*repell/i,
    "zahradni-naradi",
  ],
  // === brow / makeup (before vision — «eyebrow» contains «eye») ===
  [
    /\beyebrow\b|brow\s*stamp|pudr[ăa].*spr[âa]ncen|spr[âa]ncene.*pudr|eyebrow\s*powder|pudră\s*pentru\s*sprâncene/i,
    "anti-aging",
  ],
  [
    /\bfvo\b|foundation\s*makeup|makeup\s*foundation|\bfoundation\b/i,
    "anti-aging",
  ],
  [
    /пудр[аы].*бров|бров.*пудр|водостойк.*бров|для\s*бровей/i,
    "anti-aging",
  ],
  [
    /\bvenzen\b|fond\s*de\s*ten|bb\s*cream|makeup\s*cushion|cushion\s*(?:foundation|makeup)|bb\s*cushion|кушон/i,
    "anti-aging",
  ],
  [
    /\bsadoer\b|whitening\s*toothpaste|pastă\s*de\s*dinți|toothpaste/i,
    "osobni-pece",
  ],
  [
    /\brhino[\s\-]*correct\b|nose\s*correct|nasal\s*correct|corrector\s*nasal|corrección\s*nasal|nose\s*shape|shape\s*clip|clip.*nariz|rhinoplasty|коррекц.*нос|корректор.*нос/i,
    "kosmeticke-nastroje",
  ],
  // === vision (before weight — Cordyceps/Reishield share brands across SKUs) ===
  [/\b(?:cleaview|ocularix|visiomax|vizonic|optilix)\b/i, "zrak"],
  [
    /\bcordyceps\b.*(?:eye|vision|aug(?:en)?|ocular|зрен|глаз|oko|lutein|sehverm(?:ögen)?)/i,
    "zrak",
  ],
  [
    /(?:eye|vision|aug(?:en)?|ocular|зрен|глаз|oko|eyesight|sehvermögen|lutein).*(?:support|health|care|gesundheit|kapsul|capsule|supplement)/i,
    "zrak",
  ],
  // === role disambiguation (before broad medical buckets) ===
  [
    /\bcordyceps\b.*(?:gewicht|abnehmen|weight|odchud|schlank|fat\s*burn|huj[šs]an|схуд|похуд)/i,
    "hubnuti",
  ],
  [
    /\breishield\b.*(?:gewicht|abnehmen|weight|odchud|schlank|fat\s*burn|huj[šs]an|схуд|похуд)/i,
    "hubnuti",
  ],
  [
    /gewicht|abnehmen|schlank|appetit|odchud|weight\s*loss|fat\s*burn|stoffwechsel|huj[šs]an|схуд|похуд/i,
    "hubnuti",
  ],
  [
    /nespeč|insomnia|melatonin|sleep\s*support|spanec|spanj|bessonn|бессон|сну\b|сна\b|храп|schnarch|ronqu|anti.?snor/i,
    "chrapani",
  ],
  [
    /\bnefro\b|kidney|ledvic|renal|nephro|почк|нефр|нирк/i,
    "ledviny",
  ],
  // === valgus spray (before joint-care — Hondro G/M/Sol SKUs) ===
  [
    /\b(?:hondro\s*g|hondro\s*m|hondro\s*sol)\b.*(?:valgus|hallux|kostochk|кісточк|косточк|spray|sprej)|(?:valgus|hallux).*(?:spray|sprej|hondro\s*sol)/i,
    "vboceny-palec",
  ],
  [/\bvalgus\b|\bhallux\b|косточк|кісточк|валгус|[\s_\-]valgus\b/i, "vboceny-palec"],
  // === hemorrhoids (before hearing — «Hämorrhoiden» contains «hör») ===
  [/proctonic|rectosave|hemorrh|hämorrh|haemorrh|hemorolok|геморр|гемол|проктофол|hemoroid|proti\s+hemoroid|protiv\s+hemoroid/i, "hemoroidy"],
  [
    /\b(?:cordyceps|reishield)\b.*(?:hemoroid|hemorrh|hämorrh|геморр|прокт|proti\s+hemoroid)|(?:hemoroid|hemorrh|hämorrh|геморр|proti\s+hemoroid).*(?:cordyceps|reishield)/i,
    "hemoroidy",
  ],
  [
    /\b(?:cordyceps|reishield)\b.*(?:papillom|borodav|hpv|condilom|warz|verruga|папилл|папіл)|(?:papillom|borodav|hpv|proti\s+papilom|papilom).*(?:cordyceps|reishield)/i,
    "papilomy",
  ],
  [
    /\b(?:cordyceps|reishield)\b.*(?:alkohol|alcohol|alkoholizm|odvisnost.*alko)|(?:alkohol|alcohol|odvisnost).*(?:cordyceps|reishield)/i,
    "alkoholismus",
  ],
  // === auto / car care (before hearing — generic partner buckets mislabel gadgets) ===
  [
    /автомобил|машин[аы]|car\s*clean|dry\s*clean|curățător.*auto|curatare.*auto|очистител.*(?:авто|машин)|cleaner.*(?:car|auto)|сух(?:ой|ая)\s+очистител/i,
    "autodoplnky",
  ],
  [/usb\s*vacuum|mini\s*vacuum|aspirator\s*compact|aspirator\s*usb/i, "domaci-vychytavky"],
  [
    /\bled\s*face\s*mask|ledmask|mască\s*led|face\s*mask\s*led/i,
    "kosmeticke-nastroje",
  ],
  [
    /\b(?:knee|genunchi)\s*(?:brace|support|pad|wrap|guard|sleeve|bandage)|genunchier|наколенник|kneepad|bandaj\s*(?:de\s*)?genunchi|\bknee\b/i,
    "klouby",
  ],
  [
    /\btestosteron|testosterone\s*(?:boost|support)?|boost\s*testosteron/i,
    "potence",
  ],
  [
    /\b(?:vermixin|cleorix)\b|antiparasitic\s*cleanse/i,
    "paraziti",
  ],
  [/rhino\s*gold|male\s*enlargement|penis\s*enlarg|\bgigant\b|увелич.*член|размер.*член/i, "zvetseni-penisu"],
  // === beauty / grooming gadgets (before hearing — KMA «Слух» bucket trap) ===
  [
    /curling\s*iron|hair\s*styler|hair\s*curler|ondulator|плойк|завивк|щипц.*волос|локон/i,
    "osobni-pece",
  ],
  [
    /бигуди|hair\s*roller|heatless\s*curl|bigudi/i,
    "osobni-pece",
  ],
  [
    /(?:beard|body|nose|ear|pet|brow|sopraccigl|бров|эпил|depil|epilat)\s*trimmer|(?:beard|body|nose|ear|pet|brow)\s*trim|триммер\s*(?:для\s*)?(?:бород|тела|носа)|stubble\s*beard|\bepilat|\bdepil/i,
    "osobni-pece",
  ],
  [
    /liquid\s*tights|жидк.*колгот|колгот|leggings|shapewear|flybra|\bbra\b|brassiere|push.?up/i,
    "obleceni",
  ],
  [
    /teeth\s*whitening|whitening\s*pen|отбеливан.*зуб|карандаш.*зуб|albire.*din/i,
    "osobni-pece",
  ],
  [
    /humidifier|увлажнител|aroma\s*diffus|aromaterap|увлажнitel|\baircalm\b/i,
    "domaci-klima",
  ],
  [
    /косметич.*кист|makeup\s*brush\s*clean|очистит.*кист.*макияж|beauty\s*tool.*brush/i,
    "kosmeticke-nastroje",
  ],
  // === hearing (before respiratory) ===
  [
    /\b(?:cordyceps|reishield)\b.*(?:sluh|hearing|слух|ух[оа]|tinnit|gehör|hörbehandl|höunterstützung|larinorm|za\s+sluh)|(?:sluh|hearing|слух|ух[оа]|tinnit|hörbehandl|höunterstützung|za\s+sluh).*(?:cordyceps|reishield)/i,
    "sluch",
  ],
  [/\bhearing\b|tinnit|слух|ух[оа]|gehör|hörbehandl|hörunterstützung|horbehandl|\bsluh\b|za\s+sluh|\botor(?:ol|hinol|ingol)?\b|larinorm|otofon/i, "sluch"],
  [/proti\s+papilom|papilom[ai]|borodavk|papillom|borodav|hpv|condilom|\bwart\b|verruga|папилл|папіл/i, "papilomy"],
  [
    /kajenj|kajenje|курени|куріння|сигарет|никотин|нікотин|табак|smok|tabex|табакоб|нікобан|anti.?smok|rauch.*entw|raucherentw|nicotin/i,
    "odvykani-koureni",
  ],
  [/alkohol|alcohol|alkoholizm|алкогол|alko|alkod|алкоб|алкотрен/i, "alkoholismus"],
  [/\b(?:motion\s+mat|massage\s+mat|massagematte|alfombrilla\s+masaje)\b/i, "domaci-vychytavky"],
  [
    /\btalorix\b|tropfen.*(?:potenc|erekt|libido)|kapljice.*(?:potenc|erekt|libido)|drops.*potenc/i,
    "potence",
  ],
  [
    /\bcortitron\b.*(?:sklep|joint|stav|staw|сустав|суглоб|artrit)|(?:sklep|joint|stav|glucosamin).*\bcortitron\b/i,
    "klouby",
  ],
  [
    /\bcortitron\b.*(?:gewicht|abnehmen|odchud|weight|schlank|huj[šs]an)|(?:gewicht|abnehmen|odchud).*\bcortitron\b/i,
    "hubnuti",
  ],
  // papilloma before respiratory — «Behandlung» contains «lung» as substring
  [
    /papillom|borodav|hpv|condilom|\bwart\b|verruga|папиллом|папілом|бородав/i,
    "papilomy",
  ],
  // === diabetes (before immunity — generic immunity bucket traps glucose SKUs) ===
  [
    /\bdm[-\s]?norm\b|\bdmnorm\b|\b(?:insulevel|balansulin|betasulin|insulinorm|diabexan|insuvit)\b|blutzucker|zuckerregul|blood\s*sugar|glucose\s*control|glicem|glycem/i,
    "cukrovka",
  ],
  [
    /\bdiabetes\b|diabetic|diabét|glucose|glycemic|insulin\s*support|azúcar|azucar|glucosa|glucém|glucem|metabolismo.*gluc|control.*azúcar|control.*azucar|диабет|глюкоз|сахар.*кров/i,
    "cukrovka",
  ],
  // === respiratory-trap disambiguators (before broad respir match) ===
  [
    /\bepil(?:ator|age)|wax\s*warmer|waxing\s*kit|ipl\s*laser|laser\s*hair/i,
    "osobni-pece",
  ],
  [
    /nail\s*(?:lamp|dryer|drill)|uv\s*nail|manicure\s*set/i,
    "kosmeticke-nastroje",
  ],
  [
    /\b(?:diy[-\s]?clock|wall\s*clock|ceas\s*de\s*designer)\b/i,
    "modni-doplnky",
  ],
  [
    /\b(?:rgb\s*led|led\s*strip|led\s*lent|bandă\s*led|band[aă]\s*led)\b/i,
    "domaci-vychytavky",
  ],
  [
    /\blaser\b.*(?:projector|proiector)|proiector\s*laser\b|лазер(?:ный|ний)?\s*проектор|проектор\s*лазер/i,
    "domaci-vychytavky",
  ],
  [
    /\bbrandcamp\b|(?:multifunc|multifunction).*(?:shovel|lopat|lopată)/i,
    "zahradni-naradi",
  ],
  [
    /\b(?:sigilant|sealant|putty)\b.*(?:găuri|gauri|hole)|\b(?:găuri|gauri)\b|герметик.*(?:отверст|дыр)|(?:отверст|дыр).*герметик/i,
    "domaci-vychytavky",
  ],
  [
    /\b(?:motion\s*sensor|senzor\s*(?:de\s*)?mișcare|senzor\s*(?:de\s*)?miscare|solar\s*(?:wall\s*)?lamp)\b|(?:светильник|фонар[ьи]).*(?:датчик|sensor)|(?:датчик|sensor).*(?:движен|motion)/i,
    "domaci-klima",
  ],
  [
    /pljuč|pljučnik|\blung(?:e|en)?\b|respir|dihal|bronch|pulmon|deep\s*inhale|легк|дых/i,
    "dychaci-cesty",
  ],
  [
    /\bzfimuno\b|imunsk|immun|imunitet|иммун|імуніт/i,
    "imunita",
  ],
  [
    /neuropat|neuropathy|neuropatie|neuropati|нейропат|norvistop|sedamin|diaflex/i,
    "stres",
  ],
  [
    /spomin|memory|cognitive|brain\s*support|koncentrac|memoria|mozg|мозг|памят|memorsh|spominsh|memorysh/i,
    "stres",
  ],
  [
    /sklep|joint|artrit|osteo|artroz|glucosamin|hondroitin|сустав|суглоб|артрит/i,
    "klouby",
  ],
  [
    /\bwormax\b|proti\s+parazit|anthelmint|vermifug|\bpara\s*clean\b/i,
    "paraziti",
  ],
  [/menstrual\s*cup|copa\s*menstrual|copita\s*menstrual|tampones?\s*menstrual/i, "zdravi-zen"],
  [
    /grass\s*trim|lawn\s*trim|hedge\s*trim|strimmer|brush\s*cut|desbrozadora|gas\s*trimmer|cordless\s*grass|триммер\s*(?:для\s*)?(?:трав|сада|газон)|косил|garden\s*tool|lawn\s*mower|chainsaw|secateur|weed\s*trim/i,
    "zahradni-naradi",
  ],
  [
    /rodent|repell(?:ent|er)?|ultrasonic\s*pest|отпугив|грызун|мыш[ьи]|mice\s*repell|rat\s*repell/i,
    "zahradni-naradi",
  ],
  [
    /\btoxic\s*off\b|\btoxofil\b|\bdetoxic\b|\bparasites?\s*off\b|\banti[-\s]?parasit/i,
    "paraziti",
  ],
  [
    /detoxion|desintoxic|toxin\b|tóxico|toxico|токсин|шлак|slag|limp(?:ieza|eza)\s*(?:corporal|intestinal|del\s+organismo)/i,
    "detox",
  ],
  [
    /парктроник|парктронік|dash\s*cam|videoregistrador|видеорегистратор|dvr|parking\s*sensor|sensor.*aparcamiento|assistant\s*parking|чехол.*лобов|чохол.*лобов|parabrisas|windshield|magnet.*windshield|насос.*топлив|diesel\s*pump|gps.*Auto|cámara.*Auto/i,
    "autodoplnky",
  ],
  [
    /\b(?:para el Auto|para Auto|accesorio.*Auto|Auto|vehículo|vehiculo|automóvil|automovil|car\s*cover|funda.*Auto)\b/i,
    "autodoplnky",
  ],
  [
    /\bliver\b|hepatic|hepato|hígado|higado|detox\s*liver|печен|печін|fegato|epatic/i,
    "jatra",
  ],
  [
    /\b(?:insulevel|balansulin|betasulin|insulinorm|diabexan)\b|blutzucker|zuckerregul|blood\s*sugar|glucose\s*control/i,
    "cukrovka",
  ],
  [
    /\bdiabetes\b|diabetic|diabét|glucose|glycem|glycemic|insulin\s*support|azúcar|azucar|glucosa|glucém|glucem|metabolismo.*gluc|control.*azúcar|control.*azucar|диабет|глюкоз|сахар.*кров/i,
    "cukrovka",
  ],
  [
    /digest|gastro|intestinal|stomach|tracto\s*gastro|gastritis|verdau|verdauung|verdauungsmittel|ЖКТ|желуд|шлунк|кишеч|пищевар|травлен/i,
    "traveni",
  ],
  [
    /\bflybra\b|\bbra\b|brassiere|bustier|sujetador|push.?up|бюстгальтер|бра\b/i,
    "obleceni",
  ],
  [
    /\bparazol\b|parazitel|parazit(?:ol|el)?|antiparasit|anthelmint|vermifuge|parasit|helmint|глист|гельмин|antiparasitic/i,
    "paraziti",
  ],
  // === potency / intimate (role words) — enlargement patterns above ===
  [/\berect(?:one|o|a|i|us)\b|potenc|potencia|libido|hyperpotency|\bpotency\b|erekt|потенц|эрекц|ерекц|еректо/i, "potence"],
  [/hair\s*growth|hair\s*loss|caída\s*capilar|minoxidil|\bcabello\b|облысени|выпаден.*волос/i, "vypadavani-vlasu"],
  [/breast\s*enlarg|aumento\s*seno|bust\s*enhanc|увелич.*груд/i, "zvetseni-prsou"],
  [/urin(?:ary|a|одelf|астоп)|cystit|urinastop|lumevita|цистит/i, "cystitida"],
  [/ipertension|hyperten|\bblood\s*pressure\b|\bhypertension\b|гипертон|давлени[еяё]|давление/i, "krevni-tlak"],
  [
    /protiglivi|proti\s+glivic|antifung|antimicot|onychomyc|\bnoktal\b|fungokiller|foot\s*trooper|glivic.*noht|грибок|грибк|mico(?:sis|ne)|micosave/i,
    "plisen-nehtu",
  ],
  [/anti.?age|rejuven|arrugas|beauty\s*age|\bcrema\b.*(?:rostro|rejuven|facial)/i, "anti-aging"],
  [/\bclothes\b|abbigliamento|showcase\s*clothes|abiti|vestiti|свадеб|плать|плаття|одяг|\bbae\b|leggings|hoodie|dress|kleidung/i, "obleceni"],
  [/money\s+amulet|fehu\s+amulet|amuleto\s+portafortuna|talisman/i, "domaci-vychytavky"],
  [/clearvision|driving\s+glasses|night\s+vision\s+glasses|gafas\s+de\s+conducción/i, "optika"],
  [/headphone|earbud|auriculares\s+wireless/i, "domaci-vychytavky"],
  [/shower\s*head|rociador\s+ducha/i, "domaci-vychytavky"],
];

function matchIntentHaystack(haystack: string): string | null {
  if (!haystack.trim()) return null;
  for (const [re, slug] of INTENT_PATTERNS) {
    if (re.test(haystack)) return slug;
  }
  const fromShakesToken = inferShakesLandingTokenSlug(haystack);
  if (fromShakesToken) return fromShakesToken;
  return null;
}

/** Infer catalog shelf slug from feed title descriptor (title-first, not brand). */
export function inferProductIntentSlug(
  rawTitle: string,
  brand?: string,
  feedText?: string,
): string | null {
  const title = rawTitle?.trim() ?? "";
  const feed = feedText?.trim() ?? "";
  if (!title && !feed) return null;

  if (title) {
    const { tail } = splitBrandAndTail(title);
    const descriptor = tail.trim();
    if (descriptor) {
      const fromTail = matchIntentHaystack(descriptor);
      if (fromTail) return fromTail;
    }

    const fromFull = matchIntentHaystack(title);
    if (fromFull) return fromFull;
  }

  if (feed) {
    if (title) {
      const fromCombined = matchIntentHaystack(`${title} ${feed}`);
      if (fromCombined) return fromCombined;
    }
    const fromFeed = matchIntentHaystack(feed);
    if (fromFeed) return fromFeed;
  }

  if (brand?.trim() && title) {
    return matchIntentHaystack(`${brand} ${title}${feed ? ` ${feed}` : ""}`);
  }
  return null;
}

function conflictRulesForSlug(slug: string): string {
  const hits = INTENT_BUCKET_CONFLICTS.filter((c) => c.intentSlug === slug);
  if (!hits.length) return "";
  return hits
    .map(
      (c) =>
        `- Cím szókincs → polc «${c.intentSlug}», NE «${c.badSlug}» ha a feed bucket általános`,
    )
    .join("\n");
}

export function buildProductIntentGuideCS(brief: {
  cleanBrand: string;
  rawTitle: string;
  categorySlug: string;
  productRole?: string;
  feedCleaned?: string;
}): string {
  const inferred =
    inferProductIntentSlug(brief.rawTitle, brief.cleanBrand, brief.feedCleaned) ??
    (brief.productRole?.trim()
      ? inferProductIntentSlug(brief.productRole, brief.cleanBrand, brief.feedCleaned)
      : null);
  const shelfSlug = inferred ?? brief.categorySlug;
  const desc = getCategoryDescriptor(shelfSlug);
  const vocabulary = desc?.mustMention?.length
    ? `\nPolc szókincs «${shelfSlug}»: ${desc.mustMention.join(", ")}`
    : desc?.short
      ? `\nVárt terméktípus: ${desc.short}`
      : "";

  const disambiguationGuide = buildShelfDisambiguationGuideCS({
    cleanBrand: brief.cleanBrand,
    rawTitle: brief.rawTitle,
    categorySlug: brief.categorySlug,
    productRole: brief.productRole,
  });

  const classificationGuide = buildShelfClassificationGuideCS();

  const conflictBlock = INTENT_BUCKET_CONFLICTS.slice(0, 10)
    .map(
      (c) =>
        `- Cím jelzés → polc «${c.intentSlug}», ne «${c.badSlug}» (hagyd figyelmen kívül a feed általános bucket-jét)`,
    )
    .join("\n");

  const dynamic =
    inferred && inferred !== brief.categorySlug
      ? `\n«${brief.rawTitle.slice(0, 80)}» esetén:\n  Leíróból polc: «${inferred}»\n  Oldal polca: «${brief.categorySlug}» — a termék valódi típusáról írj.\n${conflictRulesForSlug(inferred)}`
      : inferred
        ? `\nPolc egyezik a leíróval: «${inferred}».${vocabulary}`
        : "";

  return `${classificationGuide}

${disambiguationGuide}

=== KATALÓGUS POLC (feed leíró, nem márka) ===
A polcot a feed termékszerepe alapján válaszd, ne a márka alapján.
Az általános bucket-ek (Nők, Szépség, Növelés, Paraziták) nem írhatják felül a cím leíróját.

Feed vs polc szabályok:
${conflictBlock}
${dynamic}

Írd az URL-t, morzsamenüt és szöveget a termék valódi típusa szerint.`;
}

/** Feed cues for household/auto/gadget products (not medical supplements). */
export const APPLIANCE_FEED_CUE_RE =
  /очистител|автомобил|машин[аы]|curățător|curatare|vacuum|telecomandă|telecomanda|încălzitor|incalzitor|aspirator|electrocasnic|rc\s*car|dry\s*clean|car\s*clean|cleaner.*(?:car|auto)|usb\s*vacuum|mini\s*vacuum|avion\s*cu|saltea\s*de\s*masaj/i;

const MEDICAL_MISBUCKET_SLUGS = new Set([
  ...SPECIFIC_MEDICAL_SLUGS,
  "dychaci-cesty",
  "stres",
  "imunita",
  "jatra",
  "ledviny",
  "traveni",
  "detox",
]);

export function isApplianceFeedCue(haystack: string): boolean {
  return APPLIANCE_FEED_CUE_RE.test(haystack);
}

export function isMedicalMisbucketSlug(slug: string): boolean {
  return MEDICAL_MISBUCKET_SLUGS.has(slug);
}
