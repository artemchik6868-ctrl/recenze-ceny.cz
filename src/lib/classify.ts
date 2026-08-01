// Shared product → category classifier.
// Title-first rule order: regex array is scanned top-to-bottom; the FIRST
// match wins. Place narrow, brand/title-level patterns BEFORE broad ones.
//
// Callers pass `${title} ${feedCategory}`. The title is at the start, so
// any regex that matches an unambiguous title token (e.g. "Papillom") wins
// over generic feed-bucket words further down the string (e.g. "паразит").
//
// IMPORTANT: keep `papillomas` ABOVE `parasites` — they share feed buckets
// in KMA ("Паразиты, папилломы") and we want title to disambiguate.

import { inferProductIntentSlug, INTENT_PATTERNS } from "./product-intent.cs";

export const KEYWORD_TO_SLUG: Array<[RegExp, string]> = [
  // === specific medical niches (narrow → broad) ===
  [/диабет|diab|sugar/i, "cukrovka"],
  [
    /\b(?:knee|genunchi)\s*(?:brace|support|pad|wrap|guard|sleeve|bandage)|genunchier|наколенник|kneepad|bandaj\s*(?:de\s*)?genunchi|\bknee\b/i,
    "klouby",
  ],
  [/(?:гипертон|давлени[еяё]|давление|pressure|hyperten|cardio|кардио|кардин|кардін|вітокард|витокард|серцев|сердечн|heart)/i, "krevni-tlak"],
  [/сустав|артрит|артроз|joint|остео|osteo|кост(?:оч|и|ей|ям)/i, "klouby"],
  [/папиллом|папілом|папіллом|papillom|бородав|кондилом|впч|hpv/i, "papilomy"],
  // === Title-first product intent (from product-intent.es.ts) ===
  ...INTENT_PATTERNS.map(([re, slug]) => [re, slug] as [RegExp, string]),
  // === AdCombo English feed categories (categories[] labels) ===
  [/\b(?:penis|male)\s*enlargement\b|rhino\s*gold/i, "zvetseni-penisu"],
  [/\bpotency\b|talorix/i, "potence"],
  [/\bhypertension\b/i, "krevni-tlak"],
  [/\bdiabetes\b/i, "cukrovka"],
  [/\bjoints?\b|hondro|orosteel/i, "klouby"],
  [/\bvaricose\b/i, "krecove-zily"],
  [/\bhemorrhoids?\b/i, "hemoroidy"],
  [/\bcystitis\b/i, "cystitida"],
  [/\bprostatitis\b/i, "prostata"],
  [/\bweight\s*loss\b/i, "hubnuti"],
  [/\bfungus\b/i, "plisen-nehtu"],
  [/\bparasites?\b/i, "paraziti"],
  [/\bliver\b|liv\s*caps/i, "jatra"],
  [/\beyesight\b|vizonic|ocul/i, "zrak"],
  [/\bhearing\b|audix|u\s*caps/i, "sluch"],
  [/\banti-?age\b/i, "anti-aging"],
  [/\baccessories\b/i, "modni-doplnky"],
  [/\bwhite\s*products\b|enence|derila|tvidler|nuubu/i, "domaci-vychytavky"],
  // === English gadget / auto title cues (before broad medical buckets) ===
  [/\b(?:headphone|earbud|cuffie|wireless\s+audio)\b/i, "domaci-vychytavky"],
  [/\b(?:shower\s*head|soffione\s+doccia)\b/i, "domaci-vychytavky"],
  [/\b(?:amulet|amuleto|talisman)\b/i, "domaci-vychytavky"],
  [/\b(?:glass\s*coating|vetro\s+liquido)\b/i, "autodoplnky"],
  [/\b(?:inflatable.*sofa|lamzac|air\s+sofa)\b/i, "domaci-vychytavky"],
  // === Optics / eyewear (before broad accessories) ===
  [/\b(?:driving\s+glasses|night\s+vision|clearvision)\b/i, "optika"],
  [/(?:очки|окуляр|\bglasses\b)/i, "optika"],
  // === Shakes.pro title descriptors (niche after "Brand IT - …") ===
  [/\bweight loss treatment\b|\bw-?loss\b|redusizer|dr\.?skinny|abslim/i, "hubnuti"],
  [/\btreatment for papillomas?\b|removio/i, "papilomy"],
  [/\bhemorrhoids? treatment\b|proctonic/i, "hemoroidy"],
  [/\bpotency\b|urogun|libid/i, "potence"],
  [/\badult\s*\(?gel\)?\b|\bgigant\b/i, "zvetseni-penisu"],
  [/\banti-?age\b|elesse/i, "anti-aging"],
  [/\bjoints\b|hondrofrost|artroflex|fortuflex/i, "klouby"],
  [/\bfungus\b|fungokiller|foot trooper/i, "plisen-nehtu"],
  [/\bocularix\b|\beye function\b/i, "zrak"],
  [/\bprostat|prostal/i, "prostata"],
  [/\bvaricose\b|venis/i, "krecove-zily"],
  [/\bdiabet|insulinorm|diaform|insulevel|balansulin|betasulin|diabexan/i, "cukrovka"],
  [/\bcardiotensive\b|cardiobalance/i, "krevni-tlak"],
  [/\bcystitis\b|cysti/i, "cystitida"],
  [/\bparasites?\b|toxic off/i, "paraziti"],
  [/\bsnoring\b|\bsnore/i, "chrapani"],
  [/\bvalgus\b/i, "vboceny-palec"],
  // === English / partner product_category labels ===
  [/\bDiet\b/i, "hubnuti"],
  [/\bBeauty\b/i, "other"],
  [/\bWatch\/jewelery\b/i, "modni-doplnky"],
  [/\bEconomizer\b/i, "domaci-vychytavky"],
  [/\bGeneral\b/i, "domaci-vychytavky"],
  [/\bAdult\b/i, "potence"],
  [/\brejuvenat(?:ing|ion)\b|eudalie/i, "anti-aging"],
  [/\bhyperpotency\b/i, "potence"],
  [/\balcoholism\b/i, "alkoholismus"],
  [/\bmemory\b/i, "stres"],
  [/\bvision\b|cleaview/i, "zrak"],
  [/увелич.*член|пенис|penis|размер.*член|alphademix|maral.?gel|ерголонг|rhino\s*gold|male\s*enlargement|penis\s*enlarg/i, "zvetseni-penisu"],
  [/увелич.*груд|boostella|breast/i, "zvetseni-prsou"],
  [/потенц|эрекц|ерекц|еректо|erekt|libidov|braverol|maxeron|potenex|tribulus|vigrandex|red.?machine|potenup|potenlex|ericil|уретрокс/i, "potence"],
  [/простат|prostat|prostan|menolid|avaler|poten.?strong|potentguard|неопрост|уровельмин/i, "prostata"],
  // garden power tools BEFORE personal-grooming trimmer substring
  [
    /grass\s*trim|lawn\s*trim|hedge\s*trim|strimmer|brush\s*cut|desbrozadora|podador|gas\s*trimmer|cordless\s*grass|триммер\s*(?:для\s*)?(?:трав|сада|газон)|косил|садов.*триммер|garden\s*tool|lawn\s*mower|chainsaw|secateur|weed\s*trim/i,
    "zahradni-naradi",
  ],
  [
    /(?:beard|body|nose|ear|pet|brow|sopraccigl|бров|эпил|depil|epilat)\s*trimmer|(?:beard|body|nose|ear|pet|brow)\s*trim|триммер\s*(?:для\s*)?(?:бород|тела|носа)|\bepilat|\bdepil/i,
    "osobni-pece",
  ],
  [/похуд|жирос|стройн|снижени.*вес|slim|weight|skineform|liposize|липокарнит|candy.?slim|metabalance|meta.?balance/i, "hubnuti"],
  [/(?!.*(?:grass|lawn|garden|hedge|yard|vrt|сад|sadovnjak))\btrim(?:ming|mer|mer\s*per)?\b/i, "hubnuti"],
  [/binocul|monocul|monokul|монокул|monocular|telescop|бинокл|подзорн|лупа\s|magnif/i, "optika"],
  [/зрени|зір|глаз|око\b|optil|optilix|oftilex|oculminex|офтальм|капл.*(?:глаз|ок)|(?:глаз|ок).*капл/i, "zrak"],
  [/геморр|hemorrh|hämorrh|haemorrh|rectosave|proctonic|гемол|проктофол/i, "hemoroidy"],
  [/паразит|глист|parasit|gelmiv|gelmiforte|bactefort|bactiolin|farmacin|parazil|parazol|parazitel|toxilife|pansiton|гельмин|anthelmint/i, "paraziti"],
  [/жкт|желуд|шлунк|пищевар|травлен|кишеч|кишків|digest|stomach|гастрит|stomac.?lacte|санацин/i, "traveni"],
  [/грибок|ногт|нігт|fungus|mico|псорілайт|psorilite|miconef|micosave|миконефрол/i, "plisen-nehtu"],
  [/варикоз|варик|тромбоф|тромбоз|тромб\b|tromblexan|flebonol|varicose|venoton|варіко|varic|венозн|вен(?:ах|ы|и|ам|ами)\b|\bвены\b|\bвени\b/i, "krecove-zily"],
  [/псориаз|псоріаз|psori|псорифол/i, "lupenka"],
  [/алкогол|alko|alkod|алкоб|алкотрен/i, "alkoholismus"],
  [/курени|куріння|сигарет|никотин|нікотин|табак|smok|tabex|табакоб|нікобан/i, "odvykani-koureni"],
  [/цистит|cyst|urin(?:ary|a|odelf|астоп)|urinastop|lumevita/i, "cystitida"],
  [/слух|tinnit|\botor(?:ol|hinol|ingol)?\b|otof|hearing|саше.*слух|ларинорм|отифонекс/i, "sluch"],
  [/вальгус|valgus|valgofix|косточк|кісточк/i, "vboceny-palec"],
  [/волос|облысени|облисінн|hair|шампунь|shampo|platinus/i, "vypadavani-vlasu"],
  [/омолож|морщин|зморшк|омолод|anti.?aging|liftensyn|revidermis|shiseydo|luvexan/i, "anti-aging"],
  [/нерв|нейропат|стресс|стрес\b|депресс|депрес|nerv|neuro|stress|norvistop/i, "stres"],
  [/храп|хроп|snor|храпоб/i, "chrapani"],
  [/(тонометр|глюкометр|пульсоксиметр|blood\s*pressure\s*monitor|давление.*монитор|глюкоз.*монитор)/i, "lekarske-pristroje"],

  // === home and lifestyle (specific BEFORE general) ===
  [/(массаж(?:ер|ёр|ний|ний\s*пістолет|ный\s*пистолет)|массажн.*пистолет|massage\s*gun|massager)/i, "masazni-pristroje"],

  // heated apparel (vest/jacket) — before home-climate and broad clothing
  [/(?:heated|подогрев|з\s*підігр|с\s*подогревом).*(?:vest|gilet|giacc|жилет|куртк)|(?:vest|gilet|жилет|куртк).*(?:heated|подогрев|з\s*підігр)/i, "vyhrivane-obleceni"],

  // home climate: heaters, fans, AC, humidifiers, electric blankets / heated mats (not clothing)
  [/(обогрева|нагрев(?:ательн|ательний)|кондиционер|кондиціонер|увлажнит|зволожув|handy\s*heater|electric.*heater|air\s*conditioner|нагрівальн|термоковдр|термопростин|електропростин|электропростын|простын.*подогрев|простинь.*підігр|heated\s*(?:mat|pad|blanket|sheet))/i, "domaci-klima"],

  // beauty tools (must come before broad clothing/household)
  [/(косметич(?:еских?|еские)?\s+кист|чист.*кист.*макияж|очистит.*кист|щётк.*для\s+лиц|beauty\s*tool|makeup\s+brush)/i, "kosmeticke-nastroje"],

  // home textile (pleds, blankets, sheets — non-electric)
  [/(\bплед\b|плед[\s-]|плед\.|одеял|ковдр|подушк|наматрасн|наматрац|постельн|постільн|sheets?\b|blanket|pillow)/i, "domaci-textil"],

  // outdoor / camping / fishing
  [/(палатк|намет\b|рыболовн|риболовн|fish(?:ing)?\b|fishnet|spinning|кемпинг|кемпінг|camping|походн.*лампа|фонар.*турист|фонарь.*турист|magic\s*cool\s*camping)/i, "outdoor-kempovani"],

  // kids toys (RC wall climbers before broad auto)
  [/(wall\s*racer|macchina.*(?:parete|muro|wall|стен|стін)|radiocomandat.*(?:parete|muro|wall|soffitto)|rc.*(?:wall|ceiling|parete)|машинк.*(?:стен|стін|потолок)|giocattol.*radiocomand|игрушк.*радио|radiocomandat.*giocattol)/i, "hracky"],

  // kids toys
  [/(детск.*игрушк|дитяч.*іграш|игрушеч|пістолет.*мильн|пистолет.*мыльн|мыльн.*пузыр|мильн.*бульб|\btoy\b|bubble\s*gun)/i, "hracky"],

  // auto electronics / accessories
  [/(парктроник|парктронік|чехол.*лобов|чохол.*лобов|чехол.*на\s+стекло|magnet.*windshield|насос.*топлив|diesel\s*pump|assistant\s*parking|видеорегистратор|відеореєстратор|dvr)/i, "autodoplnky"],

  // home gadgets (audio, mini-vacuums/pumps, USB)
  [/(виниловый|вініловий|bluetooth.*колонк|колонк.*bluetooth|мини[\s-]?насос|міні[\s-]?насос|usb[\s-]?(?:пилосос|пылесос|вентилят|лампа)|ночник[\s-]?bluetooth|проигрыватель|програвач)/i, "domaci-vychytavky"],

  // garden tools (separate from agro fertilizers)
  [/(садов.*светильник|садов.*ліхтар|садов.*лампа|опрыскиватель|обприскув|лейк[аи]\s+садов|шланг.*полив|solar\s*garden|светлячок|grass\s*trim|lawn\s*trim|hedge\s*trim|strimmer|lawn\s*mower|chainsaw|secateur|garden\s*tool|weed\s*trim|sadovnjak|vrt\b)/i, "zahradni-naradi"],

  // === non-medical fashion niches (specific) ===
  [/(обув|туфл|кроссов|кросів|сапог|чобот|ботин|сандал|кеды|кед\b|sneaker|shoes|boots)/i, "boty"],
  [/(куртк|пальт|плать|плаття|джинс|блуз|футболк|свитер|свiтер|свiтер|худи|толстовк|одяг|одежд|шорт|юбк|спідниц|колготк|panchok|капюшоном.*пончо|пончо|waist\s*trainer|corset|корсет|бандаж|shapewear|\bclothes\b|abiti|vestiti|свадеб|showcase\s*clothes|abbigliamento)/i, "obleceni"],
  [/(сумк|рюкзак|ремен|часы|годинник|очки|окуляр|ремінь|пояс\b|кошел|гаман|wallet|backpack|bag)/i, "modni-doplnky"],

  // === general gender / domestic categories (last) ===
  [/мужск|\bmen'?s\b|мужчин/i, "potence"],
  [/женск|жінк|менопауз|women/i, "zdravi-zen"],
  [/удобрен|добрив|агро\b|agro|fertili|myco\+|агрохелс|агро\s*майстер/i, "zahrada"],
  [/(чист(?:ящ|ка|ить|ка)|моющ|стир|пилосос|пылесос|щётк|щётка|щетк|clean|laund)/i, "domaci-potreby"],
  [/автомобил|авто\b|\bмашин\b|\bcar\b/i, "autodoplnky"],
];

export function classifyByText(text: string, fallback = "other"): string {
  if (!text) return fallback;
  for (const [re, slug] of KEYWORD_TO_SLUG) if (re.test(text)) return slug;
  return fallback;
}

/**
 * Title-first classifier. Run the keyword set on the product title alone.
 * If it matches a non-fallback category, return it. Otherwise fall back to
 * the full `title + feedCategory` string (matches generic bucket words).
 *
 * Use this from sync modules so the feed-bucket label cannot override an
 * unambiguous title cue (e.g. "Papillom Max" inside KMA's mixed bucket
 * "Паразиты, папилломы" — title wins → papillomas, not parasites).
 */
export function classifyTitleFirst(
  title: string,
  feedCategoryText: string,
  fallback = "other",
): string {
  const intent = inferProductIntentSlug(title || "");
  if (intent) return intent;
  const fromFeed = inferProductIntentSlug(title || "", undefined, feedCategoryText || "");
  if (fromFeed) return fromFeed;
  const titleSlug = classifyByText(title || "", fallback);
  if (titleSlug !== fallback) return titleSlug;
  return classifyByText(`${title || ""} ${feedCategoryText || ""}`, fallback);
}
