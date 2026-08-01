/**
 * Fix corrupted RegExp literals in ai-content.server.ts (UTF-8 safe write).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const tsPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/lib/ai-content.server.ts");
let ts = readFileSync(tsPath, "utf8");

const keepBlock = `const CATEGORY_KEEP_REGEX: Record<string, RegExp> = {
  "paraziti": /(паразит|гельмін|гельмин|глист|antiparasit|parasit)/iu,
  "papilomy": /(папілом|папиллом|папіллом|papillom|бородав|кондилом|впч|hpv)/iu,
  "plisen-nehtu": /(грибк|грибок|мікоз|микоз|онихомик|оніхомік|ногт|нігт|fungus)/iu,
  "alkoholismus": /(алкогол|alko|alcohol|залежн|зависим)/iu,
  "odvykani-koureni": /(курін|курени|сигарет|нікотин|никотин|табак|smok|tabex)/iu,
  "prostata": /(простат|prostat|сечовип|мочеиспуск|чоловіч|мужск|men)/iu,
  "potence": /(потенц|ерекц|эрекц|лібідо|либидо|чоловіч|мужск|men|erekt|erect|potenc|potenza|sexual)/iu,
  "zrak": /(зір|зрен|очі|глаз|око|optic|vision|eye|зорів)/iu,
  "intimate-comfort": /(геморр?|hemorrh|анальн|прямої кишк|прямой кишк|delicate|інтим|интим|proctonic|rectosave)/iu,
  "cystitida": /(цистит|сечовий|мочев|urinar|cyst|сеч[оі]в)/iu,
  "klouby": /(суглоб|сустав|артрит|артроз|остео|joint|кост[оа]|кістк)/iu,
  "krevni-tlak": /(тиск|давлен|гіпертон|гипертон|серц|сердц|cardio|hyperten|pressure)/iu,
  "cukrovka": /(цукор|сахар|глюкоз|діабет|диабет|sugar|diab|insul)/iu,
  "hubnuti": /(схуд|похуд|зайв|избыточ|жир|слим|slim|weight|метабол|metabol)/iu,
  "krecove-zily": /(варик|вен[аоиыі]|тромб|venous|varicose|flebo|варико)/iu,
  "lupenka": /(псоріаз|псориаз|psori|шкір|кож)/iu,
  "vypadavani-vlasu": /(волос|обліс|hair|шампун|shampo)/iu,
  "anti-aging": /(зморшк|морщин|омолод|омолож|ліфт|лифт|anti.?aging|молод)/iu,
  "stres": /(нерв|нейро|стрес|стресс|депрес|депресс|сну|сна|nerv|stress|sleep)/iu,
  "chrapani": /(хроп|храп|snor|сну|сна|безсон|бессон)/iu,
  "sluch": /(слух|вух|hear|tinnit|шум.{0,4}у вух|шум.{0,4}в ушах)/iu,
  "vboceny-palec": /(вальгус|valgus|кісточк|косточк)/iu,
  "traveni": /(шлунк|желуд|кишків|кишеч|травлен|пищевар|digest|stomach|гастрит)/iu,
  "jatra": /(печен|печін|liver|fegato|epatic|liv\\s*caps)/iu,
  "zvetseni-prsou": /(груд|breast|бюст)/iu,
  "zvetseni-penisu": /(член|пеніс|penis|розмір.*член|размер.*член)/iu,
  "zdravi-zen": /(жінк|женск|жіноч|женщин|menopaus|менопauз|women)/iu,
};`;

ts = ts.replace(/const CATEGORY_KEEP_REGEX: Record<string, RegExp> = \{[\s\S]*?\};/, keepBlock);

const stopBlock = `  const stopMarkers = [
    /виплат[иа][\\s\\S]*/i,
    /выплат[ыа][\\s\\S]*/i,
    /KPI[\\s\\S]*/i,
    /апрув[\\s\\S]*/i,
    /джерел(а|о) трафіку[\\s\\S]*/i,
    /источник(и)? трафика[\\s\\S]*/i,
    /заборонен[аіоі][\\s\\S]*/i,
    /запрещённ(ые|ый)[\\s\\S]*/i,
    /промо[\\s\\S]*$/i,
    /цільов(а|е) ді(я|ї)[\\s\\S]*/i,
    /целев(ая|ое) действие[\\s\\S]*/i,
  ];`;

ts = ts.replace(/  const stopMarkers = \[[\s\S]*?\];/, stopBlock);

ts = ts.replace(
  /const isElectric = \/[^/]+\/i\.test\(titleLc\);/,
  "const isElectric = /електр|elektr|usb|220|вт|ватт|watt/i.test(titleLc);",
);

ts = ts.replace(
  /if \(categorySlug === "cystitida" \|\| \/[^/]+\/iu\.test\(titleLc\)\)/,
  'if (categorySlug === "cystitida" || /цистит|сечовий\\s+моч|мочев\\s+моч|цист|cistite/iu.test(titleLc))',
);

const oldFallbackBlock = `  const looksLikeOldFallback =
    /Секци[яі]\\s+(?:комплектация|комплектація)\\s+товару|Секци[яі]\\s+комплектація\\s+товару/iu.test(secBlob) &&
    /(?:про\\s+товар|про\\s+доставку)/iu.test(secBlob);`;

ts = ts.replace(
  /  const looksLikeOldFallback =\s*\n\s*\/[\s\S]*?\/iu\.test\(secBlob\);/,
  oldFallbackBlock,
);

const badBlock = `    const BAD: RegExp[] = [
      /крем для глаз/i, /крем для очей/i,
      /для глаз/i, /для очей/i,
      /капсулы для глаз/i, /капсули для оч/i,
      /капли для глаз/i, /краплі для оч/i,
      /мазь для глаз/i, /мазь для очей/i,
      /гель для глаз/i, /гель для очей/i,
      /\\blutein\\b/i, /\\bлютеин\\b/i, /\\bluteína\\b/i, /\\bлютеїн\\b/i,
      /\\bкапсул[аы]?\\b/i, /\\bкапс\\b/i, /\\bкапсул/i, /\\bтаблет/i,
      /\\bзір\\b/i, /\\bзрен\\b/i, /\\bочей\\b/i, /\\bочі\\b/i,
      /\\bзору\\b/i, /\\bзор/i, /улучшен(?:ие|ня)\\s+зрен/i, /покращен(?:ня|ие)\\s+зор/i,
      /улучш(?:ение|ения)\\s+зрен/i, /покращ(?:ення|ення)\\s+зор/i,
      /улучшение зрения/i, /покращення зору/i,
      /диетическ(?:ая|ое)\\s+добав/i, /дієтичн(?:а|е)\\s+добав/i,
    ];`;

ts = ts.replace(/    const BAD: RegExp\[\] = \[[\s\S]*?\];/, badBlock);

const stripBrandBlock = `    // Trailing: "... —/–/-/with/by/для Brand[.!?]?"
    s = s.replace(
      new RegExp(\`[\\\\s,]+(?:—|–|-|−|with|by|для\\\\s+)?\\\\s*\${esc}\\\\s*[.!?]?\\\\s*$\`, "iu"),
      "",
    );
    // Leading: "Brand[:,?-] ..."
    s = s.replace(new RegExp(\`^\${esc}\\\\s*[—–\\\\-:,.]?\\\\s+\`, "iu"), "");
    // Middle: " Brand " between words — single space.
    s = s.replace(new RegExp(\`\\\\s+\${esc}\\\\s+\`, "giu"), " ");
    // Middle with connector: " — Brand ", " для Brand "
    s = s.replace(
      new RegExp(\`\\\\s+(?:—|–|-|−|with|by|для)\\\\s+\${esc}(?=[\\\\s.,!?]|$)\`, "giu"),
      "",
    );`;

ts = ts.replace(
  /    \/\/ Trailing:[\s\S]*?new RegExp\(`\\s\+\(\?:[\s\S]*?\);\n  }\n  s = s\.replace/,
  `${stripBrandBlock}\n  }\n  s = s.replace`,
);

ts = ts.replace(/s = s\.replace\(\/\^\[\?\?\\\-:,.\s\]\+\/, ""\)\.trim\(\);/, 's = s.replace(/^[—–\\-:,.\\s]+/, "").trim();');

writeFileSync(tsPath, ts, "utf8");
console.log("Patched", tsPath);
