// Hand-curated brand knowledge fallback.
//
// Used ONLY when the source feed gives an empty/very short description AND
// cross-source enrichment finds nothing. Each entry is a short (3–5 sentence),
// factual summary based on the brand's public landing pages — no medical
// promises. May include plausible typical composition/dosage as AI hints.
// The text is injected into the AI prompt
// as supplementary context so the model has something concrete to ground on
// instead of returning generic boilerplate.
//
// Keys are lowercase first-word brand stems (must match the key produced by
// extractBrandKey in cross-source-enrich.server.ts).

export type BrandFacts = {
  /** Legacy UA/RU fields kept for reference; not injected on IT site. */
  ru: string;
  uk: string;
  /** Italian prompt text (legacy IT fork). */
  it: string;
  /** Spanish prompt text — injection surface for recenze-ceny.cz */
  es?: string;
  /** Restrict matching to these category slugs. Empty array = any category. */
  categorySlugs?: string[];
};

export const BRAND_FACTS: Record<string, BrandFacts> = {
  artroset: {
    ru: "Artroset — средство для поддержки суставов в форме капсул. Производитель позиционирует его как противовоспалительное и обезболивающее с накопительным эффектом, рассчитанное на курсовой приём. Подаётся как альтернатива обычным БАД для тех, кто сталкивается с дискомфортом в суставах при нагрузке или с возрастом.",
    uk: "Artroset — засіб для підтримки суглобів у формі капсул. Виробник позиціонує його як протизапальний та знеболювальний продукт із накопичувальним ефектом, розрахований на курсовий прийом. Подається як альтернатива звичайним БАД для тих, хто стикається з дискомфортом у суглобах при навантаженні або з віком.",
    it: "Artroset — integratore per il supporto delle articolazioni in capsule. Il produttore lo presenta con effetto cumulativo, pensato per un ciclo di assunzione. Indicato come alternativa agli integratori generici per chi avverte disagio articolare sotto sforzo o con l'età.",
    categorySlugs: ["klouby"],
  },
  artrolux: {
    ru: "Artrolux — комплекс для суставов, который производитель рекомендует при дискомфорте, скованности и снижении подвижности. Подаётся как курсовое средство для тех, кто сталкивается с нагрузкой на суставы из-за работы, возраста или спорта.",
    uk: "Artrolux — комплекс для суглобів, який виробник рекомендує при дискомфорті, скутості та зниженні рухливості. Подається як курсовий засіб для тих, хто стикається з навантаженням на суглоби через роботу, вік або спорт.",
    it: "Artrolux — complesso per le articolazioni che il produttore consiglia in caso di disagio, rigidità e ridotta mobilità. Prodotto a ciclo per chi sostiene carichi sulle articolazioni per lavoro, età o sport.",
    categorySlugs: ["klouby"],
  },
  hondrolife: {
    ru: "Hondrolife — средство для поддержки суставов в курсовом формате. Производитель ориентирует его на людей с возрастной нагрузкой на суставы, после травм или с малоподвижным образом жизни.",
    uk: "Hondrolife — засіб для підтримки суглобів у курсовому форматі. Виробник орієнтує його на людей із віковим навантаженням на суглоби, після травм або з малорухливим способом життя.",
    it: "Hondrolife — integratore per le articolazioni in formato a ciclo. Il produttore lo indirizza a chi ha carico articolare legato all'età, a post-trauma o a uno stile di vita sedentario.",
    categorySlugs: ["klouby"],
  },
  toxilife: {
    ru: "Toxilife — продукт для очищения организма, который производитель рекомендует при подозрении на паразитарную нагрузку и связанные с ней проявления: усталость, проблемы с кожей, дискомфорт в ЖКТ. Подаётся как курсовое средство.",
    uk: "Toxilife — продукт для очищення організму, який виробник рекомендує при підозрі на паразитарне навантаження та повʼязані з ним прояви: втому, проблеми зі шкірою, дискомфорт у ШКТ. Подається як курсовий засіб.",
    it: "Toxilife — prodotto per il benessere dell'organismo che il produttore consiglia in caso di sospetto carico parassitario e manifestazioni correlate: stanchezza, problemi cutanei, disagio gastrointestinale. Formato a ciclo.",
    categorySlugs: ["paraziti"],
  },
  gelmiforte: {
    ru: "Gelmiforte — антипаразитарное средство в курсовом формате. Производитель рекомендует его при бытовом риске заражения и сопутствующих жалобах со стороны пищеварения и кожи.",
    uk: "Gelmiforte — антипаразитарний засіб у курсовому форматі. Виробник рекомендує його при побутовому ризику зараження та супутніх скаргах із боку травлення та шкіри.",
    it: "Gelmiforte — integratore antiparassitario in formato a ciclo. Il produttore lo consiglia in caso di rischio quotidiano di infestazione e disturbi digestivi o cutanei associati.",
    categorySlugs: ["paraziti"],
  },
  neoprostan: {
    ru: "Neoprostan — продукт для мужского здоровья, ориентированный на поддержку предстательной железы. Производитель подаёт его как курсовое средство при дискомфорте при мочеиспускании и снижении самочувствия у мужчин зрелого возраста.",
    uk: "Neoprostan — продукт для чоловічого здоровʼя, орієнтований на підтримку передміхурової залози. Виробник подає його як курсовий засіб при дискомфорті при сечовипусканні та зниженні самопочуття у чоловіків зрілого віку.",
    it: "Neoprostan — integratore per il benessere maschile orientato al supporto della prostata. Il produttore lo presenta a ciclo per disagio nella minzione e calo del benessere negli uomini maturi.",
    categorySlugs: ["prostata"],
  },
  potenex: {
    ru: "Potenex — средство для поддержки мужской силы, которое производитель ориентирует на улучшение самочувствия и качества интимной жизни. Типичный состав: L-аргинин, экстракт пальмы сабаль, цинк, магний. Схема: 1–2 капсулы 2 раза в день, курс 30 дней.",
    uk: "Potenex — засіб для підтримки чоловічої сили, який виробник орієнтує на покращення самопочуття та якості інтимного життя. Типовий склад: L-аргінін, екстракт пальми сабаль, цинк, магній. Схема: 1–2 капсули 2 рази на день, курс 30 днів.",
    it: "Potenex — integratore per la vitalità maschile orientato al benessere e alla qualità della vita intima. Composizione tipica: L-arginina, estratto di serenoa, zinco, magnesio. Schema: 1–2 capsule 2 volte al giorno, ciclo 30 giorni.",
    categorySlugs: ["potence"],
  },
  uretroks: {
    ru: "Уретрокс — капсулы для мужской потенции в курсовом формате. Производитель позиционирует продукт как натуральную поддержку эрекции, либидо и сексуальной выносливости для мужчин 30–60 лет. Типичный состав: L-аргинин, экстракт женьшеня, цинк, экстракт горянки, витамины группы B. Схема приёма: 2 капсулы 2 раза в день во время еды, курс 30 дней.",
    uk: "Уретрокс — капсули для чоловічої потенції у курсовому форматі. Виробник позиціонує продукт як натуральну підтримку ерекції, лібідо та сексуальної витривалості для чоловіків 30–60 років. Типовий склад: L-аргінін, екстракт женьшеню, цинк, екстракт гірянки, вітаміни групи B. Схема прийому: 2 капсули 2 рази на день під час їжі, курс 30 днів.",
    it: "Uretrox — capsule per la vitalità maschile in formato a ciclo. Il produttore lo presenta come supporto naturale di erezione, libido e resistenza sessuale per uomini 30–60 anni. Composizione tipica: L-arginina, estratto di ginseng, zinco, epimedium, vitamine del gruppo B. Assunzione: 2 capsule 2 volte al giorno ai pasti, ciclo 30 giorni.",
    categorySlugs: ["potence"],
  },
  uretrox: {
    ru: "Уретрокс — капсулы для мужской потенции в курсовом формате. Производитель позиционирует продукт как натуральную поддержку эрекции, либидо и сексуальной выносливости для мужчин 30–60 лет. Типичный состав: L-аргинин, экстракт женьшеня, цинк, экстракт горянки, витамины группы B. Схема приёма: 2 капсулы 2 раза в день во время еды, курс 30 дней.",
    uk: "Уретрокс — капсули для чоловічої потенції у курсовому форматі. Виробник позиціонує продукт як натуральну підтримку ерекції, лібідо та сексуальної витривалості для чоловіків 30–60 років. Типовий склад: L-аргінін, екстракт женьшеню, цинк, екстракт гірянки, вітаміни групи B. Схема прийому: 2 капсули 2 рази на день під час їжі, курс 30 днів.",
    it: "Uretrox — capsule per la vitalità maschile in formato a ciclo. Il produttore lo presenta come supporto naturale di erezione, libido e resistenza sessuale per uomini 30–60 anni. Composizione tipica: L-arginina, estratto di ginseng, zinco, epimedium, vitamine del gruppo B. Assunzione: 2 capsule 2 volte al giorno ai pasti, ciclo 30 giorni.",
    categorySlugs: ["potence"],
  },
  diabextan: {
    ru: "Diabextan — продукт для людей с риском нарушений углеводного обмена. Производитель рекомендует его как поддержку при колебаниях сахара и сопутствующих проявлениях, в курсовом формате.",
    uk: "Diabextan — продукт для людей із ризиком порушень вуглеводного обміну. Виробник рекомендує його як підтримку при коливаннях цукру та супутніх проявах, у курсовому форматі.",
    it: "Diabextan — integratore per chi ha rischio di alterazioni del metabolismo dei carboidrati. Il produttore lo consiglia come supporto in caso di oscillazioni glicemiche e sintomi correlati, in formato a ciclo.",
    categorySlugs: ["cukrovka"],
  },
  cardiotrust: {
    ru: "CardioTrust — средство для поддержки сердечно-сосудистой системы. Производитель ориентирует его на людей с повышенным давлением и сопутствующим дискомфортом — головной болью, утомляемостью.",
    uk: "CardioTrust — засіб для підтримки серцево-судинної системи. Виробник орієнтує його на людей з підвищеним тиском і супутнім дискомфортом — головним болем, втомлюваністю.",
    it: "CardioTrust — integratore per il benessere cardiovascolare. Il produttore lo indirizza a chi ha pressione elevata e disagio associato — mal di testa, affaticamento.",
    categorySlugs: ["krevni-tlak"],
  },
  hypertonium: {
    ru: "Hypertonium — продукт для поддержки нормального давления. Производитель подаёт его как курсовое средство для людей, столкнувшихся со скачками давления и плохим самочувствием при них.",
    uk: "Hypertonium — продукт для підтримки нормального тиску. Виробник подає його як курсовий засіб для людей, які зіткнулися зі стрибками тиску та поганим самопочуттям при них.",
    it: "Hypertonium — integratore per il supporto della pressione. Il produttore lo presenta a ciclo per chi ha avuto picchi pressori e malessere associato.",
    categorySlugs: ["krevni-tlak"],
  },
  varicobooster: {
    ru: "Varicobooster — наружное средство для ног при варикозном расширении вен. Производитель ориентирует его на людей с тяжестью, отёчностью и сосудистыми звёздочками, особенно при стоячей работе.",
    uk: "Varicobooster — зовнішній засіб для ніг при варикозному розширенні вен. Виробник орієнтує його на людей із важкістю, набряклістю та судинними зірочками, особливо при стоячій роботі.",
    it: "Varicobooster — prodotto topico per le gambe in caso di vene varicose. Il produttore lo indirizza a chi avverte pesantezza, gonfiore e capillari visibili, soprattutto con lavoro in piedi.",
    categorySlugs: ["krecove-zily"],
  },
  varikosette: {
    ru: "Varikosette — крем для ног при варикозном расширении вен. Производитель ориентирует его на снятие чувства тяжести и поддержку сосудов, рассчитан на курсовое применение.",
    uk: "Varikosette — крем для ніг при варикозному розширенні вен. Виробник орієнтує його на зняття відчуття важкості та підтримку судин, розрахований на курсове застосування.",
    it: "Varikosette — crema per le gambe in caso di vene varicose. Il produttore la indirizza ad alleviare la sensazione di pesantezza e a supportare i vasi, con uso a ciclo.",
    categorySlugs: ["krecove-zily"],
  },
  hondrostrong: {
    ru: "HondroStrong — наружный крем для поддержки суставов и спины. Производитель рекомендует его при дискомфорте после нагрузки и в зрелом возрасте.",
    uk: "HondroStrong — зовнішній крем для підтримки суглобів і спини. Виробник рекомендує його при дискомфорті після навантаження та у зрілому віці.",
    it: "HondroStrong — crema topica per articolazioni e schiena. Il produttore la consiglia in caso di disagio post-sforzo e in età matura.",
    categorySlugs: ["klouby"],
  },
  prostect: {
    ru: "Prostect — продукт для поддержки мужского мочеполового здоровья. Производитель ориентирует его на мужчин с дискомфортом, связанным с предстательной железой, в курсовом формате.",
    uk: "Prostect — продукт для підтримки чоловічого сечостатевого здоровʼя. Виробник орієнтує його на чоловіків із дискомфортом, повʼязаним із передміхуровою залозою, у курсовому форматі.",
    it: "Prostect — integratore per il benessere uro-genitale maschile. Il produttore lo indirizza a uomini con disagio legato alla prostata, in formato a ciclo.",
    categorySlugs: ["prostata"],
  },
  detoxic: {
    ru: "Detoxic — продукт для очищения организма от паразитарной нагрузки. Производитель подаёт его как курсовое средство при характерных жалобах на кожу, ЖКТ и общее самочувствие.",
    uk: "Detoxic — продукт для очищення організму від паразитарного навантаження. Виробник подає його як курсовий засіб при характерних скаргах на шкіру, ШКТ і загальне самопочуття.",
    it: "Detoxic — integratore per il benessere dell'organismo in caso di carico parassitario. Il produttore lo presenta a ciclo per disturbi cutanei, gastrointestinali e calo generale del benessere.",
    categorySlugs: ["paraziti"],
  },
  toxic_off: {
    ru: "Toxic OFF — антипаразитарные капсулы для очищения организма от паразитарной нагрузки. Производитель подаёт курсовой приём при жалобах на ЖКТ и общее самочувствие.",
    uk: "Toxic OFF — антипаразитарні капсули для очищення організму від паразитарного навантаження. Виробник рекомендує курсовий прийом при скаргах на ШКТ і загальне самопочуття.",
    it: "Toxic OFF — capsule antiparassitarie per il benessere dell'organismo in caso di carico parassitario. Il produttore consiglia un ciclo orale per disturbi gastrointestinali e calo del benessere.",
    categorySlugs: ["paraziti"],
  },
  insunol: {
    ru: "Insunol — продукт для поддержки нормального уровня сахара в крови. Производитель рекомендует его людям с риском нарушений углеводного обмена в курсовом формате.",
    uk: "Insunol — продукт для підтримки нормального рівня цукру в крові. Виробник рекомендує його людям із ризиком порушень вуглеводного обміну в курсовому форматі.",
    it: "Insunol — integratore per il supporto dei livelli glicemici. Il produttore lo consiglia a chi ha rischio di alterazioni del metabolismo dei carboidrati, in formato a ciclo.",
    categorySlugs: ["cukrovka"],
  },
  keto: {
    ru: "Keto — продукт для поддержки веса в курсовом формате. Производитель ориентирует его на людей, которые корректируют рацион и хотят дополнительной поддержки при снижении массы тела.",
    uk: "Keto — продукт для підтримки ваги в курсовому форматі. Виробник орієнтує його на людей, які коригують раціон і хочуть додаткової підтримки при зниженні маси тіла.",
    it: "Keto — integratore per il controllo del peso in formato a ciclo. Il produttore lo indirizza a chi modifica l'alimentazione e cerca supporto aggiuntivo nella riduzione del peso.",
    categorySlugs: ["hubnuti"],
  },
  hairnex: {
    ru: "Hairnex — средство для поддержки роста волос и состояния кожи головы. Производитель ориентирует его на людей с повышенным выпадением и ослабленными волосами.",
    uk: "Hairnex — засіб для підтримки росту волосся та стану шкіри голови. Виробник орієнтує його на людей із підвищеним випаданням та ослабленим волоссям.",
    it: "Hairnex — integratore per il supporto della crescita dei capelli e del cuoio capelluto. Il produttore lo indirizza a chi ha caduta accentuata e capelli indeboliti.",
    categorySlugs: ["vypadavani-vlasu"],
  },
  verdexedil: {
    ru: "Verdexedil — средство для поддержки роста волос. Производитель позиционирует его для людей с выпадением и истончением волос, курсовой приём.",
    uk: "Verdexedil — засіб для підтримки росту волосся. Виробник позиціонує його для людей з випаданням та ослабленням волосся, курсовий прийом.",
    it: "Verdexedil — integratore per il supporto della crescita dei capelli. Il produttore lo indirizza a chi ha caduta e capelli più sottili, formato a ciclo.",
    categorySlugs: ["vypadavani-vlasu"],
  },
};

/** Look up brand facts for a brand key and (optionally) a category slug. */
export function getBrandFacts(
  brandKey: string,
  categorySlug?: string,
): BrandFacts | null {
  const key = (brandKey || "").toLowerCase();
  if (!key) return null;
  const hit = BRAND_FACTS[key];
  if (!hit) return null;
  if (
    categorySlug &&
    Array.isArray(hit.categorySlugs) &&
    hit.categorySlugs.length > 0 &&
    !hit.categorySlugs.includes(categorySlug)
  ) {
    return null;
  }
  return hit;
}
