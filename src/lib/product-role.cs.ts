/** Title-first product role (CZ) — separate from catalog shelf context. */

import { buildDescriptorStyleGuideCS, buildJointHondroFamilyBlockBG, buildMultiSkuBrandFamilyBlockBG } from "./ai-content.examples.cs";
import { problemRoleForShelf } from "./problem-vocabulary.cs";
import { inferShakesLandingTokenSlug } from "./shakes-landing-tokens.cs";
import { normalizePartnerFeedHaystack } from "./partner-feed-text";
import { potencyRoleForForm, POTENCY_ROLE_DEFAULT } from "./potency-vocabulary.cs";

export type ProductRoleFewShot = {
  titlePattern: string;
  roleCs: string;
  badRoleCs?: string;
};

export const PRODUCT_ROLE_FEW_SHOTS: ProductRoleFewShot[] = [
  { titlePattern: "Money Amulet", roleCs: "amulet štěstí", badRoleCs: "brýle na noční jízdu" },
  { titlePattern: "Fehu Amulet", roleCs: "runový amulet", badRoleCs: "brýle na noční jízdu" },
  { titlePattern: "ClearVisionHD Night Glasses", roleCs: "brýle na noční jízdu" },
  { titlePattern: "VENZEN Cushion", roleCs: "cushion make-up", badRoleCs: "polštář / nafukovací polštář" },
  { titlePattern: "Wireless Headphones", roleCs: "bezdrátová sluchátka" },
  { titlePattern: "Shower Head", roleCs: "sprchová hlavice" },
  { titlePattern: "Motion Mat", roleCs: "masážní podložka" },
  { titlePattern: "Lamzac Air Sofa", roleCs: "nafukovací vzduchová pohovka" },
  { titlePattern: "EDGII legíny", roleCs: "formující legíny" },
  { titlePattern: "Waist Trainer", roleCs: "formující pás" },
  { titlePattern: "Handy Heater", roleCs: "přenosné elektrické topidlo" },
  { titlePattern: "Glass Coating", roleCs: "tekutý ochranný nátěr na sklo", badRoleCs: "doplněk stravy" },
  { titlePattern: "Verdexedil", roleCs: "doplněk stravy na růst vlasů", badRoleCs: "doplněk stravy na zvětšení poprsí" },
  { titlePattern: "Hairnex", roleCs: "doplněk stravy pro vlasy" },
  { titlePattern: "Erectone Active", roleCs: "kapsle na potenci", badRoleCs: "proti hemoroidům doplněk stravy" },
  { titlePattern: "Proctonic", roleCs: "proti hemoroidům doplněk stravy", badRoleCs: "kapsle na potenci (když feed mluví o hemoroidech)" },
  { titlePattern: "Menstrual Cup", roleCs: "opakovaně použitelný menstruační kalíšek", badRoleCs: "kapsle na potenci" },
  { titlePattern: "Pulsero", roleCs: "kapsle na potenci", badRoleCs: "obecná mužská vitalita" },
  {
    titlePattern: "Uromexil — capsule (brand-only, description: potență)",
    roleCs: "kapsle na potenci",
    badRoleCs: "doplněk stravy na krevní tlak (CPA TL hypertenze bucket)",
  },
  { titlePattern: "Potenex", roleCs: "kapsle na potenci", badRoleCs: "produkt na mužskou energii" },
  { titlePattern: "Pest Reject — ultrasonic rodent", roleCs: "ultrazvukový odpuzovač hlodavců", badRoleCs: "obecný komfortní produkt" },
  { titlePattern: "Rhino Correct — nose shape clip", roleCs: "nosní korektor", badRoleCs: "gel na zvětšení penisu" },
  { titlePattern: "Rhino — penis enlargement gel", roleCs: "gel na zvětšení penisu", badRoleCs: "mužský produkt" },
  { titlePattern: "Verdexedil — hair spray", roleCs: "sprej na vlasy", badRoleCs: "doplněk stravy pro vlasy" },
  { titlePattern: "BAE — legíny / clothing", roleCs: "legíny", badRoleCs: "boty" },
  { titlePattern: "Flybra — sujetador push-up", roleCs: "push-up podprsenka", badRoleCs: "domácí potřeba" },
  { titlePattern: "Toxofil — papilomas", roleCs: "doplněk stravy proti bradavicím", badRoleCs: "proti parazitům" },
  { titlePattern: "Parazol — antiparasitic tea", roleCs: "čaj proti parazitům", badRoleCs: "doplněk stravy proti bradavicím" },
  { titlePattern: "Parazitel — vermifuge capsules", roleCs: "proti parazitům doplněk stravy", badRoleCs: "doplněk stravy proti bradavicím" },
  {
    titlePattern: "detoxil Water Parasites",
    roleCs: "proti parazitům kapky",
    badRoleCs: "čaj proti parazitům nebo kapsle",
  },
  { titlePattern: "detoxil — digestion tracto GI", roleCs: "doplněk stravy na podporu trávení", badRoleCs: "proti parazitům" },
  {
    titlePattern: "Toxic OFF",
    roleCs: "proti parazitům kapsle",
    badRoleCs: "doplněk stravy na podporu trávení",
  },
  {
    titlePattern: "detoxic — antiparasitic",
    roleCs: "proti parazitům kapsle",
    badRoleCs: "detox / trávení",
  },
  {
    titlePattern: "NutriMix — kapsule proti nespečnosti",
    roleCs: "kapsle na podporu spánku",
    badRoleCs: "doplněk stravy na kontrolu hmotnosti",
  },
  {
    titlePattern: "Otto — kapsule za spomin",
    roleCs: "kapsle na paměť a koncentraci",
    badRoleCs: "doplněk stravy na kontrolu hmotnosti",
  },
  {
    titlePattern: "Nefro Aktiv — napitek za ledvice",
    roleCs: "nápoj na podporu ledvin",
    badRoleCs: "doplněk stravy pouze na cystitidu",
  },
  {
    titlePattern: "Hondroine — gel za sklepe",
    roleCs: "kloubní gel k vnějšímu použití",
    badRoleCs: "kloubní kapsle",
  },
  {
    titlePattern: "ArtiZynt — gel za sklepe",
    roleCs: "kloubní gel",
    badRoleCs: "kloubní kapsle",
  },
  {
    titlePattern: "ArtiZynt — kapsule za sklepe",
    roleCs: "kloubní kapsle",
    badRoleCs: "kloubní gel",
  },
  {
    titlePattern: "Hondrofrost — cooling gel",
    roleCs: "kloubní gel",
    badRoleCs: "kloubní doplněk stravy",
  },
  {
    titlePattern: "Hondrofrost",
    roleCs: "kloubní gel",
    badRoleCs: "kloubní kapsle (jen kvůli joint-care bucketu)",
  },
  {
    titlePattern: "Cortitron — intimate comfort AT",
    roleCs: "proti hemoroidům kapsle",
    badRoleCs: "doplněk stravy pro intimní komfort",
  },
  {
    titlePattern: "Proctonic — hemorrhoids cream",
    roleCs: "krém proti hemoroidům",
    badRoleCs: "proti hemoroidům kapsle",
  },
  {
    titlePattern: "Hondro G — spray valgus",
    roleCs: "sprej proti vbočeným palcům",
    badRoleCs: "ortopedická pomůcka / silikonová dlaha",
  },
  {
    titlePattern: "Hondro Sol — spray valgus / hallux",
    roleCs: "sprej proti vbočeným palcům",
    badRoleCs: "kloubní produkt / doplněk stravy",
  },
  {
    titlePattern: "Hondro Sol — kloubní sprej",
    roleCs: "kloubní sprej",
    badRoleCs: "doplněk stravy / kloubní kapsle",
  },
  {
    titlePattern: "Promicil — Nagelpilz Creme",
    roleCs: "krém proti plísni nehtů",
    badRoleCs: "kapsle proti plísni nehtů",
  },
  {
    titlePattern: "Removio — Gel Papillome",
    roleCs: "gel proti bradavicím",
    badRoleCs: "kapsle proti bradavicím",
  },
  {
    titlePattern: "InsuLevel — Blutzucker / diabetes",
    roleCs: "doplněk stravy na regulaci hladiny cukru",
    badRoleCs: "doplněk stravy na podporu trávení",
  },
  {
    titlePattern: "Insulinorm — diabetes glucose",
    roleCs: "doplněk stravy na regulaci hladiny cukru",
    badRoleCs: "doplněk stravy na podporu trávení",
  },
  {
    titlePattern: "Cortitron — joint capsules",
    roleCs: "kloubní kapsle",
    badRoleCs: "proti hemoroidům kapsle",
  },
  {
    titlePattern: "Cortitron — weight loss",
    roleCs: "kapsle na kontrolu hmotnosti",
    badRoleCs: "proti hemoroidům kapsle",
  },
  {
    titlePattern: "Talorix — drops potency",
    roleCs: "kapky na potenci",
    badRoleCs: "kapky na mužskou vitalitu",
  },
  {
    titlePattern: "W-Loss — weight loss / shujšanje",
    roleCs: "kapky na kontrolu hmotnosti",
    badRoleCs: "kapsle na kontrolu hmotnosti",
  },
  {
    titlePattern: "Abslim — weight loss / shujšanje",
    roleCs: "kapky na kontrolu hmotnosti",
    badRoleCs: "kapsle na kontrolu hmotnosti",
  },
  {
    titlePattern: "Benaga — alkohol / alcohol",
    roleCs: "kapsle na podporu při závislosti na alkoholu",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Benaga — abiau / weight loss",
    roleCs: "kapsle na kontrolu hmotnosti",
    badRoleCs: "kapsle na odvykání kouření (značka ≠ role)",
  },
  {
    titlePattern: "Cordyceps — proti hemoroidom",
    roleCs: "proti hemoroidům kapsle",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Reishield — proti hemoroidom",
    roleCs: "proti hemoroidům kapsle",
    badRoleCs: "přípravek na dýchací cesty (jen kvůli značce — CHYBA)",
  },
  {
    titlePattern: "Reishield — papilomi / papillomas",
    roleCs: "kapsle proti bradavicím",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Reishield — alkohol / alcohol dependency",
    roleCs: "kapsle na podporu při závislosti na alkoholu",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Cordyceps — za sluh / hearing",
    roleCs: "kapsle na podporu sluchu",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Reishield — shujšanje / weight loss",
    roleCs: "kapsle na kontrolu hmotnosti",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Cordyceps — hearing support",
    roleCs: "kapsle na podporu sluchu",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Cordyceps — hemorrhoids",
    roleCs: "proti hemoroidům kapsle",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Proctonic — hemorrhoids",
    roleCs: "krém proti hemoroidům",
    badRoleCs: "proti hemoroidům kapsle",
  },
  {
    titlePattern: "Rectosave — hemorrhoids",
    roleCs: "gel proti hemoroidům",
    badRoleCs: "intimní komfort",
  },
  {
    titlePattern: "Proctowell — hemorrhoids",
    roleCs: "krém proti hemoroidům",
    badRoleCs: "doplněk stravy pro intimní komfort",
  },
  {
    titlePattern: "Cleaview — vision capsules",
    roleCs: "kapsle na podporu zraku",
    badRoleCs: "korekce zraku",
  },
  {
    titlePattern: "ProstAktiv — prostate capsules",
    roleCs: "kapsle na prostatu",
    badRoleCs: "krém k vnějšímu použití",
  },
  {
    titlePattern: "Benaga Chaga — kapsule za kajenje",
    roleCs: "kapsle na odvykání kouření",
    badRoleCs: "žvýkačka na odvykání kouření",
  },
  {
    titlePattern: "Icexin — krema za sklepe",
    roleCs: "kloubní gel k vnějšímu použití",
    badRoleCs: "kloubní kapsle",
  },
  {
    titlePattern: "Wormax — kapsule proti parazitom",
    roleCs: "proti parazitům kapsle",
    badRoleCs: "doplněk stravy proti bradavicím",
  },
  {
    titlePattern: "Reishield — produkt na stavke",
    roleCs: "kloubní doplněk stravy",
    badRoleCs: "doplněk stravy na játra",
  },
  {
    titlePattern: "Reishield — kapsule za valgus",
    roleCs: "kapsle na podporu při vbočeném palci",
    badRoleCs: "ortopedická pomůcka / silikonová dlaha",
  },
  {
    titlePattern: "Para Clean — kapsule proti parazitom",
    roleCs: "proti parazitům kapsle",
    badRoleCs: "domácí čisticí prostředek",
  },
  {
    titlePattern: "Otto — kapsule za spomin (detox bucket)",
    roleCs: "kapsle na paměť a koncentraci",
    badRoleCs: "detox kapsle",
  },
  {
    titlePattern: "Hemorolok — kapsule proti hemoroidom",
    roleCs: "proti hemoroidům kapsle",
    badRoleCs: "intimní komfort doplněk stravy",
  },
  {
    titlePattern: "NOKTAL GEL — protiglivična raztopina",
    roleCs: "gel proti plísni nehtů",
    badRoleCs: "anti-aging doplněk stravy",
  },
  {
    titlePattern: "Deep Inhale — čaj za pljuča",
    roleCs: "čaj na dýchací cesty",
    badRoleCs: "doplněk stravy na nervový systém",
  },
  {
    titlePattern: "DIY-Clock — ceas de designer",
    roleCs: "designové hodinky / hodinky na sestavení",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Laser — laserový projektor",
    roleCs: "laserový projektor",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "RGB LED Lent — bandă LED",
    roleCs: "LED pásek / dekorativní osvětlení",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "BRANDCAMP — multifunkční lopatka",
    roleCs: "multifunkční lopatka",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "sigilant găuri — sealant",
    roleCs: "těsnění děr",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Smart lampă senzor mișcare",
    roleCs: "solární lampa s pohybovým senzorem",
    badRoleCs: "přípravek na dýchací cesty",
  },
  {
    titlePattern: "Reishield — kapsule za spomin / memory",
    roleCs: "kapsle na paměť a koncentraci",
    badRoleCs: "doplněk stravy proti stresu (jen kvůli nervous-system bucketu)",
  },
  {
    titlePattern: "Reishield — neuropat / neuropatie",
    roleCs: "kapsle proti neuropatii",
    badRoleCs: "doplněk stravy proti stresu (jen kvůli nervous-system bucketu)",
  },
  {
    titlePattern: "Cordyceps — neuropat / neurosh",
    roleCs: "kapsle proti neuropatii",
    badRoleCs: "doplněk stravy na nervový systém",
  },
  {
    titlePattern: "ZFimuno — doplněk stravy na imunitu",
    roleCs: "doplněk stravy na imunitu",
    badRoleCs: "doplněk stravy na paměť a koncentraci",
  },
  {
    titlePattern: "Aerflow — anti snoring",
    roleCs: "chrápání proti produkt",
    badRoleCs: "komfort produkt",
  },
  {
    titlePattern: "Reishield — weight loss / odchudzanie",
    roleCs: "kapsle na kontrolu hmotnosti",
    badRoleCs: "kloubní doplněk stravy",
  },
  {
    titlePattern: "Cordyceps Pulse — ochi / vision support",
    roleCs: "kapsle na podporu zraku",
    badRoleCs: "kapsle na kontrolu hmotnosti (značka «Pulse» ≠ hubnutí)",
  },
  {
    titlePattern: "Cordyceps — weight loss / abiau",
    roleCs: "kapsle na kontrolu hmotnosti",
    badRoleCs: "kapsle na zrak (jiný popis ve feedu)",
  },
  { titlePattern: "Balansulin — control automático de azúcar", roleCs: "doplněk stravy na regulaci hladiny cukru", badRoleCs: "autodoplňky" },
  { titlePattern: "Betasulin — diabetes / glucose", roleCs: "doplněk stravy na regulaci hladiny cukru", badRoleCs: "doplněk stravy na podporu trávení" },
  { titlePattern: "Parking Sensor — para Auto", roleCs: "parkovací senzor pro vozidla", badRoleCs: "doplněk stravy" },
  { titlePattern: "Parasol parabrisas", roleCs: "kryt čelního skla", badRoleCs: "domácí textilie" },
  { titlePattern: "Gigant — enlargement gel", roleCs: "gel na zvětšení penisu", badRoleCs: "potencia gel" },
  { titlePattern: "Knee — knee brace / genunchier", roleCs: "kolenní ortéza", badRoleCs: "doplněk stravy na krevní tlak" },
  { titlePattern: "Vermixin — antiparasitic", roleCs: "proti parazitům kapsle", badRoleCs: "doplněk stravy na imunitu" },
  { titlePattern: "Cleorix — parasite cleanse", roleCs: "proti parazitům kapsle", badRoleCs: "doplněk stravy na imunitu" },
  { titlePattern: "Benaga — testosterone boost", roleCs: "kapsle na testosteron a mužskou vitalitu", badRoleCs: "domácí produkt" },
  { titlePattern: "Balancio — (nur Marke, balancioloss)", roleCs: "kapsle na kontrolu hmotnosti", badRoleCs: "wellness produkt" },
  { titlePattern: "Neoflorax — (nur Marke, othersh)", roleCs: "doplněk stravy na podporu trávení", badRoleCs: "napi wellness produkt" },
  { titlePattern: "Benaga Chaga — (nur Marke, othersh)", roleCs: "doplněk stravy na podporu trávení", badRoleCs: "domácí / wellness produkt" },
  { titlePattern: "Cordyceps Pulse — (nur Marke, rejuvsh)", roleCs: "anti-aging doplněk stravy", badRoleCs: "wellness produkt" },
  { titlePattern: "Rhino Correct — nose clip", roleCs: "nosní korektor", badRoleCs: "domácí gadget" },
  { titlePattern: "Curling iron — hair styler", roleCs: "žehlička na vlasy", badRoleCs: "produkt pro sluch" },
  { titlePattern: "Щипцы для завивки — плойка", roleCs: "žehlička na vlasy", badRoleCs: "kapsle na podporu sluchu" },
  { titlePattern: "бигуди для волос", roleCs: "natáčky na vlasy", badRoleCs: "doplněk stravy na podporu sluchu" },
  { titlePattern: "Stubble Beard — триммер для бороды", roleCs: "trimmer na vousy", badRoleCs: "produkt pro sluch" },
  { titlePattern: "AirCalm — аромаувлажнитель", roleCs: "aromaterapeutický zvlhčovač", badRoleCs: "kapsle na podporu sluchu" },
  { titlePattern: "карандаш для отбеливания зубов", roleCs: "pero na bělení zubů", badRoleCs: "doplněk stravy na podporu sluchu" },
  { titlePattern: "LED face mask", roleCs: "LED maska na obličej", badRoleCs: "produkt pro sluch" },
  { titlePattern: "Eyebrow powder", roleCs: "pudr na obočí", badRoleCs: "doplněk stravy pro oči" },
  {
    titlePattern: "DM-Norm — glucose / glicemie",
    roleCs: "doplněk stravy na regulaci hladiny cukru",
    badRoleCs: "doplněk stravy na imunitu",
  },
  {
    titlePattern: "Cordyceps Pulse — (csak márka, rejuvsh, kapsle)",
    roleCs: "anti-aging doplněk stravy",
    badRoleCs: "make-up základ / makeup krém",
  },
  {
    titlePattern: "Cordyceps — hemoroid / hemorsh (capsule)",
    roleCs: "proti hemoroidům kapsle",
    badRoleCs: "krém proti hemoroidům",
  },
  {
    titlePattern: "Neoflorax / Cordyceps — othersh digestive",
    roleCs: "doplněk stravy na podporu trávení",
    badRoleCs: "wellness / obecný produkt na pohodu",
  },
];

const ROLE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:money\s+amulet|fehu\s+amulet|amulet|amuleto|talisman|talismano)\b/i, "amulet štěstí"],
  [
    /\brhino[\s\-]*correct\b|nose\s*correct|nasal\s*correct/i,
    "nosní korektor",
  ],
  [/\bgigant\b|penis\s*enlargement|enlargement\s*gel/i, "gel na zvětšení penisu"],
  [
    /\bvenzen\b|fond\s*de\s*ten|bb\s*cream|makeup\s*cushion|cushion\s*foundation|bb\s*cushion|кушон/i,
    "cushion make-up",
  ],
  [/(?<!bb\s)(?<!makeup\s)\b(?:cushion|cojín|pillow)\b/i, "polštář"],
  [/\b(?:headphone|earbud|auriculares|wireless\s+audio)\b/i, "bezdrátová sluchátka"],
  [/\b(?:shower\s*head|rociador\s+ducha)\b/i, "sprchová hlavice"],
  [/\b(?:cleaview|optilix|ocularix|visiomax)\b/i, "kapsle na podporu zraku"],
  [
    /\bcordyceps\b.*(?:eye|vision|aug(?:en)?|ocular|зрен|глаз|oko|lutein|sehverm(?:ögen)?)/i,
    "kapsle na podporu zraku",
  ],
  [/\bprostaktiv\b/i, "kapsle na prostatu"],
  [
    /\b(?:driving\s+glasses|night\s+(?:vision|glasses)|clearvision|gafas\s+(?:de\s+)?conduccion)\b/i,
    "brýle na noční jízdu",
  ],
  [/\b(?:legíny|waist\s+trainer|corset|faja)\b/i, "formující oblečení"],
  [/\b(?:motion\s+mat|alfombrilla\s+masaje|massage\s+mat)\b/i, "masážní podložka"],
  [
    /\b(?:hondro\s*g|hondro\s*m|hondro\s*sol)\b.*(?:valgus|hallux|spray|sprej)|(?:valgus|hallux).*(?:spray|sprej|hondro\s*sol)/i,
    "sprej proti vbočeným palcům",
  ],
  [
    /\bhondro\s*sol\b.*(?:spray|sprej|sklep|joint|gelenk)|(?:spray|sprej).*\bhondro\s*sol\b/i,
    "kloubní sprej",
  ],
  [/\bpromicil\b/i, "krém proti plísni nehtů"],
  [/\bremovio\b/i, "gel proti bradavicím"],
  [
    /\b(?:insulevel|balansulin|betasulin|insulinorm|diabexan)\b|blutzucker|zuckerregul|blood\s*sugar|glucose\s*control/i,
    "doplněk stravy na regulaci hladiny cukru",
  ],
  [
    /\b(?:cordyceps|reishield)\b.*(?:sluh|hearing|слух|ух[оа]|tinnit|auz|za\s+sluh)|(?:sluh|hearing|слух|za\s+sluh).*(?:cordyceps|reishield)/i,
    "kapsle na podporu sluchu",
  ],
  [
    /\b(?:cordyceps|reishield)\b.*(?:hemoroid|hemorrh|геморр|proti\s+hemoroid)|(?:hemoroid|hemorrh|proti\s+hemoroid).*(?:cordyceps|reishield)/i,
    "proti hemoroidům kapsle",
  ],
  [
    /\b(?:cordyceps|reishield)\b.*(?:papillom|borodav|hpv|proti\s+papilom|papilom)|(?:papillom|borodav|proti\s+papilom|papilom).*(?:cordyceps|reishield)/i,
    "kapsle proti bradavicím",
  ],
  [
    /\b(?:cordyceps|reishield)\b.*(?:alkohol|alcohol|odvisnost)|(?:alkohol|alcohol|odvisnost).*(?:cordyceps|reishield)/i,
    "kapsle na podporu při závislosti na alkoholu",
  ],
  [/proti\s+hemoroid|protiv\s+hemoroid/i, "proti hemoroidům kapsle"],
  [/proti\s+papilom|papilom[ai]|borodavk/i, "kapsle proti bradavicím"],
  [/za\s+sluh|\bsluh\b/i, "kapsle na podporu sluchu"],
  [/\bw[- ]?loss\b/i, "kapky na kontrolu hmotnosti"],
  [/\babslim\b/i, "kapky na kontrolu hmotnosti"],
  [/\bredusizer\b/i, "kapky na hubnutí"],
  [
    /\b(?:w[- ]?loss|abslim)\b.*(?:shuj|huj|odchud|abiau|weight|gewicht)|(?:shuj|huj|odchud|abiau|weight|gewicht).*\b(?:w[- ]?loss|abslim)\b/i,
    "kapky na kontrolu hmotnosti",
  ],
  [/shuj[šs]anj|huj[šs]anj/i, "přípravek na kontrolu hmotnosti"],
  [/alkohol|alcohol|alkoholizm|алкогол|alko|alkod|алкоб|алкотрен|odvisnost/i, "kapsle na podporu při závislosti na alkoholu"],
  [/\btalorix\b/i, "kapky na potenci"],
  [
    /\bcortitron\b.*(?:sklep|joint|stav|staw|сустав|суглоб)|(?:sklep|joint|stav).*\bcortitron\b/i,
    "kloubní kapsle",
  ],
  [
    /\bcortitron\b.*(?:gewicht|abiau|odchud|weight)|(?:gewicht|abiau|odchud).*\bcortitron\b/i,
    "kapsle na kontrolu hmotnosti",
  ],
  [/\b(?:lamzac|inflatable\s+sofa|air\s+sofa|sofá\s+hinchable)\b/i, "nafukovací vzduchová pohovka"],
  [/\b(?:glass\s+coating|cristal\s+líquido|liquid\s+glass)\b/i, "tekutý ochranný nátěr na sklo"],
  [/menstrual\s*cup|copa\s*menstrual/i, "opakovaně použitelný menstruační kalíšek"],
  [/rodent|repell(?:ent|er)?|ultrasonic\s*pest|отпугив|грызун/i, "ultrazvukový odpuzovač hlodavců"],
  [/nose\s*correct|nasal\s*correct|corrector\s*nasal|nose\s*shape|shape\s*clip|clip.*nariz|rhinoplasty/i, "nosní korektor"],
  [/\btoxic\s*off\b|\bdetoxic\b|\btoxofil\b/i, "proti parazitům kapsle"],
  [/\bparazol\b|parazitel|čaj\s+proti\s+parazit|anthelmint|antiparasit|helmint|glist|\bwormax\b|proti\s+parazit/i, "proti parazitům kapsle"],
  [/\bdetoxil\b/i, "proti parazitům kapky"],
  [/papillom|borodav|hpv|condilom|\bwart\b|verruga/i, "doplněk stravy proti bradavicím"],
  [/digest|gastro|intestinal|tracto\s*gastro|ЖКТ|желуд|шлунк/i, "doplněk stravy na podporu trávení"],
  [/flybra|\bbra\b|brassiere|bustier|sujetador|push.?up/i, "push-up podprsenka"],
  [/\b(?:parking\s*sensor|sensor.*aparcamiento|parabrisas|parasol.*Auto|dash\s*cam|videoregistrador)\b/i, "parkovací senzor / autodoplňky"],
  [/\b(?:handy\s+heater|portable\s+heater|room\s+heater)\b/i, "přenosné elektrické topidlo"],
  [/\b(?:usb\s+battery|power\s+bank|batería\s+portátil)\b/i, "přenosná USB baterie"],
  [/\b(?:mini\s+vacuum|aspirador\s+mini|usb\s+vacuum)\b/i, "mini USB vysavač"],
  [/\b(?:monocular|monoculare|binocular|binocular|telescope|telescopio)\b/i, "přenosná optika"],
  [/\b(?:bubble\s+gun|pistola\s+(?:de\s+)?burbujas)\b/i, "hra s mýdlovými bublinami"],
  [/\b(?:wall\s+(?:racer|climber)|Auto\s+radiocontrol)\b/i, "radiem ovládané vozidlo"],
  [/spray.*(?:hair|haar|capilar)|haarspray|verdexedil.*spray/i, "sprej na vlasy"],
  [/verdexedil|foltene|platinus|hairnex|minoxidil|caída\s*capilar|\bcabello\b/i, "doplněk stravy pro vlasy"],
  [/\brhino\b(?!.*correct).*(?:gel|enlarg|penis|member)|(?:gel|enlarg).*\brhino\b/i, "gel na zvětšení penisu"],
  [/boostella|breast\s*enlarg|aumento\s*seno/i, "doplněk stravy na zvětšení poprsí"],
  [
    /nespeč|insomnia|melatonin|sleep\s*support|spanec|bessonn|бессон|сну\b|сна\b/i,
    "kapsle na podporu spánku",
  ],
  [
    /\bneuro\s+othersh\b|\bneurosh\b|\bneuropatsh\b/i,
    "kapsle proti neuropatii",
  ],
  [
    /neuropat|neuropathy|neuropatie|neuropati|нейропат|norvistop|sedamin|diaflex/i,
    "kapsle proti neuropatii",
  ],
  [
    /\b(?:reishield|cordyceps)\b.*(?:neuropat|neurosh|neuropatsh)/i,
    "kapsle proti neuropatii",
  ],
  [/spomin|memory|cognitive|brain\s*support|koncentrac|memoria|mozg|мозг|памят|pamięć|pamiec|memorsh|spominsh|memorysh/i, "kapsle na paměť a koncentraci"],
  [
    /\b(?:reishield|cordyceps)\b.*(?:spomin|memory|memor|memorsh|spominsh)/i,
    "kapsle na paměť a koncentraci",
  ],
  [/\bnefro\b|kidney|ledvic|renal|почк|нефр|nephro/i, "nápoj na podporu ledvin"],
  [
    /\breishield\b.*(?:weight|gewicht|odchud|abiau|schlank|huj[šs]an|схуд|похуд)|(?:weight|gewicht|odchud|abiau|odchudz).*\breishield\b/i,
    "kapsle na kontrolu hmotnosti",
  ],
  [
    /\bcordyceps\b.*(?:weight|gewicht|abiau|odchud|huj[šs]an|schlank|схуд|похуд|fat\s*burn)/i,
    "kapsle na kontrolu hmotnosti",
  ],
  [
    /schnarch|ronqu|anti.?snor|против.?храп|храп\b/i,
    "chrápání proti produkt",
  ],
  [
    /\b(?:hondro|icexin|artrosteel|orosteel|hondrofrost|fortuflex|artizynt)\b.*(?:gel|krem|cream)|(?:gel|krem|cream).*(?:sklep|joint|сустав|суглоб)/i,
    "kloubní gel",
  ],
  [
    /\b(?:artizynt|hondroine|hondrofrost|hondrolife)\b.*(?:kapsul|capsule|tablet)|(?:kapsul|capsule|tablet).*(?:sklep|joint|stav|сустав|суглоб)/i,
    "kloubní kapsle",
  ],
  [
    /\b(?:hondrofrost|hondroine|hondrolife)\b(?!.*(?:kapsul|capsule|tablet))/i,
    "kloubní gel",
  ],
  [
    /(?:kapsul|capsule|tablet|suplement|NEM).*(?:sklep|joint|stav|сустав|суглоб|artrit|glucosamin|hondroitin)|(?:sklep|joint|stav|glucosamin|hondroitin|сустав|суглоб|artrit).*(?:kapsul|capsule|tablet|suplement)/i,
    "kloubní doplněk stravy",
  ],
  [
    /\b(?:kapsul|capsule|tablets?).*(?:smok|kajenj|kuren|raucher|nicotin)|(?:smok|kajenj|kuren|raucher|nicotin).*(?:kapsul|capsule|chaga)/i,
    "kapsle na odvykání kouření",
  ],
  [/\bcortitron\b.*(?:intimate|hemoroid|hemorrh|intimn)/i, "proti hemoroidům kapsle"],
  [/\bproctowell\b/i, "krém proti hemoroidům"],
  [/\bproctonic\b/i, "krém proti hemoroidům"],
  [
    /\breishield\b.*(?:valgus|kapsul|capsule)|(?:valgus|hallux).*(?:kapsul|capsule)/i,
    "kapsle na podporu při vbočeném palci",
  ],
  [/\bpara\s*clean\b|para\s*clean.*parazit/i, "proti parazitům kapsle"],
  [/\berect(?:one|o|a|i|us)\b|potenc|potencia|\bpotency\b|libido|hyperpotency/i, POTENCY_ROLE_DEFAULT],
  [/\bhemorolok\b|hemoroid/i, "proti hemoroidům kapsle"],
  [/proctonic|rectosave|hemorrh|hämorrh|haemorrh|геморр/i, "proti hemoroidům doplněk stravy"],
  [/\bnoktal\b|protiglivi/i, "gel proti plísni nehtů"],
  [/deep\s*inhale|pljuč|pljučnik|\blung(?:e|en)?\b|dihal/i, "čaj na dýchací cesty"],
  [
    /\bdm[-\s]?norm\b|\bdmnorm\b|\b(?:insulevel|balansulin|betasulin|insulinorm|diabexan|insuvit)\b|blutzucker|glicem|glycem/i,
    "doplněk stravy na regulaci hladiny cukru",
  ],
  [/\bzfimuno\b|imunsk|immun|imunitet/i, "doplněk stravy na imunitu"],
  [/balancioloss|balancio\s*wloss/i, "kapsle na kontrolu hmotnosti"],
  [/(?:neoflorax|benagachaga|cordycepspulse)\s*othersh/i, "doplněk stravy na podporu trávení"],
  [/rejuvsh|cordycepspulse\s*rejuv/i, "anti-aging doplněk stravy"],
  [
    /curling\s*iron|hair\s*styler|hair\s*curler|ondulator|плойк|завивк|щипц.*волос|локон/i,
    "žehlička na vlasy",
  ],
  [/бигуди|hair\s*roller|heatless\s*curl|bigudi/i, "natáčky na vlasy"],
  [
    /(?:beard|body|nose|ear|pet|brow|sopraccigl|бров|эпил|depil|epilat)\s*trimmer|(?:beard|body|nose|ear|pet|brow)\s*trim|триммер\s*(?:для\s*)?(?:бород|тела|носа)|stubble\s*beard|\bepilat|\bdepil/i,
    "trimmer na vousy",
  ],
  [/liquid\s*tights|жидк.*колгот|колгот|legíny|shapewear/i, "formující punčochové kalhoty"],
  [/teeth\s*whitening|whitening\s*pen|отбеливан.*зуб|карандаш.*зуб/i, "pero na bělení zubů"],
  [/humidifier|увлажнител|aroma\s*diffus|aromaterap|увлажнitel|\baircalm\b/i, "aromaterapeutický zvlhčovač"],
];

/** Infer concrete product role from feed title / brand / snippet (deterministic). */
export function inferProductRoleCs(
  rawTitle: string,
  brand?: string,
  feedSnippet?: string,
): string | null {
  const haystack = normalizePartnerFeedHaystack(
    `${brand ?? ""} ${rawTitle} ${feedSnippet ?? ""}`.trim(),
  );
  if (!haystack) return null;
  for (const [re, role] of ROLE_PATTERNS) {
    if (re.test(haystack)) return role;
  }
  const fromLanding = inferShakesLandingTokenSlug(feedSnippet ?? haystack);
  if (fromLanding) {
    return problemRoleForShelf(fromLanding) ?? null;
  }
  return null;
}

export function buildProductRoleGuideCS(brief: {
  cleanBrand: string;
  rawTitle: string;
  productRole: string;
  shelfSlug: string;
}): string {
  const examples = PRODUCT_ROLE_FEW_SHOTS.filter(
    (s) =>
      s.titlePattern.includes("Toxic OFF") ||
      s.titlePattern.includes("detoxic") ||
      s.titlePattern.includes("detoxil") ||
      s.titlePattern.includes("Parazol") ||
      s.titlePattern.includes("NutriMix") ||
      s.titlePattern.includes("Otto") ||
      s.titlePattern.includes("Nefro") ||
      s.titlePattern.includes("Hondroine") ||
      s.titlePattern.includes("Hondrofrost") ||
      s.titlePattern.includes("ArtiZynt") ||
      s.titlePattern.includes("Cortitron") ||
      s.titlePattern.includes("Proctowell") ||
      s.titlePattern.includes("Cleaview") ||
      s.titlePattern.includes("Benaga") ||
      s.titlePattern.includes("Balancio") ||
      s.titlePattern.includes("Neoflorax") ||
      s.titlePattern.includes("Icexin") ||
      s.titlePattern.includes("Hemorolok") ||
      s.titlePattern.includes("Proctonic") ||
      s.titlePattern.includes("Wormax") ||
      s.titlePattern.includes("Reishield") ||
      s.titlePattern.includes("Cordyceps") ||
      s.titlePattern.includes("Aerflow") ||
      s.titlePattern.includes("Para Clean") ||
      s.titlePattern.includes("Talorix") ||
      s.titlePattern.includes("W-Loss") ||
      s.titlePattern.includes("Gigant") ||
      s.titlePattern.includes("VENZEN") ||
      s.titlePattern.includes("Vermixin") ||
      s.titlePattern.includes("Cleorix") ||
      s.titlePattern.includes("Knee") ||
      s.titlePattern.includes("Rhino Correct") ||
      s.titlePattern.includes("Curling") ||
      s.titlePattern.includes("LED face") ||
      s.titlePattern.includes("Eyebrow"),
  )
    .concat(PRODUCT_ROLE_FEW_SHOTS.slice(0, 5))
    .slice(0, 10)
    .map((s) => {
      const bad = s.badRoleCs ? ` (NE «${s.badRoleCs}»)` : "";
      return `- «${s.titlePattern}» → «${s.roleCs}»${bad}`;
    })
    .join("\n");

  const dynamic = brief.productRole
    ? `\nPro tento produkt («${brief.cleanBrand}» / «${brief.rawTitle.slice(0, 60)}»):\n  Očekávaná role: «${brief.productRole}»\n  Katalogová kategorie «${brief.shelfSlug}» = pouze SEO kontext stránky, NE typ produktu.`
    : "";

  const hondroFamily = buildJointHondroFamilyBlockBG({
    cleanBrand: brief.cleanBrand,
    productRole: brief.productRole,
    categorySlug: brief.shelfSlug,
  });

  return `=== ROLE PRODUKTU (z feed titulku, ne z kategorie) ===
Roli produktu odvozuj z feed titulku. Katalogová kategorie («${brief.shelfSlug}») označuje jen SEO kontext stránky.
Stejná značka (např. Reishield, Benaga, Cordyceps) může mít různé SKU — roli čti z feed titulku a konce landingu, ne ze značky.

${buildMultiSkuBrandFamilyBlockBG({
    cleanBrand: brief.cleanBrand,
    productRole: brief.productRole,
    categorySlug: brief.shelfSlug,
  })}
${hondroFamily ? `\n${hondroFamily}` : ""}

Příklady feed titul → role:
${examples}

Styl: «forma + problém» — např. kapsle proti hemoroidům, ne «doplněk stravy pro intimní komfort».
${buildDescriptorStyleGuideCS({ categorySlug: brief.shelfSlug, cleanBrand: brief.cleanBrand })}
${dynamic}

Piš H1, úvod a FAQ ve formě «${brief.productRole || brief.cleanBrand}», ne jako jiný typ produktu podle kategorie.`;
}
