// Maps category slug → niche type. Niche type drives which safety/trust block
// appears on category and product pages, plus which constraints the AI gets
// when generating product descriptions. This avoids hanging a "БАД" disclaimer
// on garden lights, blankets, parking sensors etc.

export type NicheType =
  | "supplement" // БАДы, кремы, капли — пероральные/наружные средства
  | "device" //     медицинские/массажные приборы
  | "garden" //     сад, огород, дача
  | "auto" //       автотовары и автоэлектроника
  | "home" //       дом, быт, текстиль, гаджеты, дети, туризм
  | "fashion" //    одежда, обувь, аксессуары
  | "generic"; //   фолбэк

const MAP: Record<string, NicheType> = {
  // ---- health / supplements ----
  cukrovka: "supplement",
  "krevni-tlak": "supplement",
  detox: "supplement",
  klouby: "supplement",
  potence: "supplement",
  hubnuti: "supplement",
  prostata: "supplement",
  zrak: "supplement",
  hemoroidy: "supplement",
  "zdravi-zen": "supplement",
  "plisen-nehtu": "supplement",
  "krecove-zily": "supplement",
  lupenka: "supplement",
  alkoholismus: "supplement",
  "odvykani-koureni": "supplement",
  cystitida: "supplement",
  sluch: "supplement",
  "vboceny-palec": "supplement",
  "vypadavani-vlasu": "supplement",
  "zvetseni-penisu": "supplement",
  "zvetseni-prsou": "supplement",
  papilomy: "supplement",
  "anti-aging": "supplement",
  paraziti: "supplement",
  traveni: "supplement",
  jatra: "supplement",
  ledviny: "supplement",
  "dychaci-cesty": "supplement",
  imunita: "supplement",
  stres: "supplement",
  chrapani: "supplement",
  // ---- medical / massage devices ----
  "lekarske-pristroje": "device",
  "masazni-pristroje": "device",
  "osobni-pece": "device",
  optika: "home",
  // ---- garden / agro ----
  "zahradni-naradi": "garden",
  zahrada: "garden",
  // ---- auto ----
  autodoplnky: "auto",
  // ---- home / lifestyle ----
  "domaci-potreby": "home",
  "domaci-klima": "home",
  "domaci-textil": "home",
  "domaci-vychytavky": "home",
  hracky: "home",
  "outdoor-kempovani": "home",
  "kosmeticke-nastroje": "home",
  // ---- fashion ----
  boty: "fashion",
  obleceni: "fashion",
  "modni-doplnky": "fashion",
  "vyhrivane-obleceni": "fashion",
};

export function getNicheType(slug: string): NicheType {
  return MAP[slug] ?? "generic";
}

/** YMYL categories where doctor-reviewed trust badges are appropriate. */
export function isYmylCategory(slug: string): boolean {
  const niche = getNicheType(slug);
  return niche === "supplement" || niche === "device";
}

export function isSupplementCategory(slug: string): boolean {
  return getNicheType(slug) === "supplement";
}
