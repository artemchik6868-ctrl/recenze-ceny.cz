import { getCategoryContent } from "../src/lib/content.cs.ts";
import { getCategorySeoIntent } from "../src/lib/seo-intent.cs.ts";
import { SUPPLEMENT_PRIMARY_KW } from "../src/lib/supplement-serp-keywords.cs.ts";
import { isSupplementCategory } from "../src/lib/niche-types.ts";

const pilots = new Set(["klouby", "krevni-tlak", "krecove-zily"]);
const slugs = Object.keys(SUPPLEMENT_PRIMARY_KW);
let fail = 0;

for (const slug of slugs) {
  if (!isSupplementCategory(slug)) {
    console.log(`FAIL ${slug}: not supplement`);
    fail++;
    continue;
  }
  const c = getCategoryContent(slug);
  const intent = getCategorySeoIntent(slug);
  const pk = SUPPLEMENT_PRIMARY_KW[slug];
  const checks = {
    tables: (c.hubTables?.length ?? 0) >= 1,
    links: (c.hubLinks?.length ?? 0) >= 3,
    jak: c.categorySectionsHi.some((s) => /jak\s+vybrat/i.test(s.heading)),
    safety: c.categorySectionsHi.some((s) => /bezpečnost|kdy k lékaři/i.test(s.heading)),
    primary: intent.primaryKeyword === pk,
    introKw: c.categoryIntroHi.toLowerCase().includes(pk.split(" ").slice(0, 3).join(" ")),
  };
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (bad.length) {
    console.log(`FAIL ${slug}: ${bad.join(", ")}`, { primary: intent.primaryKeyword, pk });
    fail++;
  } else {
    console.log(`OK ${slug}${pilots.has(slug) ? " (pilot)" : ""}`);
  }
}

if (fail) {
  console.log(`\nsmoke: ${fail} failure(s)`);
  process.exit(1);
}
console.log(`\nsmoke: OK (${slugs.length} supplement hubs)`);
