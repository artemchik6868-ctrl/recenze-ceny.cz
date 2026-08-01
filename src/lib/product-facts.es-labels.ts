/** Map detected product facts to Spanish labels (stored in *_uk DB slots). */

import type { ProductFacts, ProductKind } from "./product-facts";

const ES_BY_KIND: Partial<
  Record<ProductKind, { form: string; required: string[]; notes: string[] }>
> = {
  device: {
    form: "dispositivo",
    required: ["dispositivo"],
    notes: ["Es un dispositivo electrónico; describe funciones, pantalla y alimentación. No es complemento ni medicamento."],
  },
  cream: { form: "crema", required: ["crema"], notes: ["Crema para uso externo; no confundir con cápsulas o comprimidos."] },
  ointment: { form: "ungüento", required: ["ungüento"], notes: ["Ungüento para uso externo."] },
  balm: { form: "bálsamo", required: ["bálsamo"], notes: ["Bálsamo para uso externo o local."] },
  serum: { form: "suero", required: ["suero"], notes: ["Suero cosmético."] },
  shampoo: { form: "champú", required: ["champú"], notes: ["Champú para el cabello."] },
  gel: { form: "gel", required: ["gel"], notes: ["Gel para uso externo o local."] },
  spray: { form: "spray", required: ["spray"], notes: ["Spray; indica modo de uso."] },
  drops: { form: "gotas", required: ["gotas"], notes: ["Gotas; indica vía de administración del feed."] },
  patch: { form: "parche", required: ["parche"], notes: ["Parche / patch transdérmico."] },
  capsules: {
    form: "cápsulas",
    required: ["cápsulas"],
    notes: ["Cápsulas para uso oral; describe composición y pauta de toma. No llamarlo crema ni gel."],
  },
  tablets: {
    form: "comprimidos",
    required: ["comprimidos"],
    notes: ["Comprimidos para uso oral; describe composición y pauta de toma."],
  },
  sachet: { form: "sobres", required: ["sobres"], notes: ["Sobres monodosis."] },
  ampoules: { form: "viales", required: ["viales"], notes: ["Viales; indica modo de uso del feed."] },
  powder: { form: "polvo", required: ["polvo"], notes: ["Polvo para disolver o mezclar."] },
  syrup: { form: "jarabe", required: ["jarabe"], notes: ["Jarabe para uso oral."] },
  tea: { form: "té", required: ["té"], notes: ["Té / infusión."] },
  orthopedic: { form: "soporte ortopédico", required: ["ortopédico"], notes: ["Soporte ortopédico; no es complemento."] },
  massager: { form: "masajeador", required: ["masaje"], notes: ["Masajeador; describe funciones y alimentación."] },
  cosmetic: { form: "cosmético", required: ["cosmético"], notes: ["Producto cosmético para uso externo."] },
  eye_care: { form: "producto para ojos", required: ["ojos"], notes: ["Producto para cuidado ocular; respeta la forma del feed."] },
  generic_item: { form: "producto", required: [], notes: ["Artículo doméstico / práctico; no complemento ni medicamento."] },
  unknown: { form: "producto", required: [], notes: ["Describe según el feed sin inventar propiedades médicas."] },
};

const GENERIC_ES: Record<string, string> = {
  сумка: "bolso",
  сумку: "bolso",
  рюкзак: "mochila",
  очиститель: "limpiador",
  светильник: "lámpara",
  проигрыватель: "tocadiscos",
  пылесос: "aspirador",
  инструмент: "herramienta",
  товар: "producto",
};

function spanishizeTerm(term: string): string {
  const lc = term.toLowerCase();
  for (const [src, dst] of Object.entries(GENERIC_ES)) {
    if (lc.includes(src)) return dst;
  }
  return term;
}

export function spanishizeProductFacts(facts: ProductFacts): ProductFacts {
  const es = ES_BY_KIND[facts.kind];
  const formEs = (es?.form ?? spanishizeTerm(facts.formLabelUk)) || "producto";
  const requiredEs =
    es?.required && es.required.length > 0
      ? es.required
      : facts.requiredTermsUk.map(spanishizeTerm).filter(Boolean);
  const notesEs =
    es?.notes ??
    [
      `Producto en forma «${formEs}»; describe en español según el feed, sin promesas médicas no respaldadas.`,
    ];
  return {
    ...facts,
    formLabelUk: formEs,
    formLabelRu: formEs,
    requiredTermsUk: requiredEs,
    requiredTermsRu: requiredEs,
    notesUk: notesEs,
    notesRu: notesEs,
  };
}

export const WATER_PHRASES_ES = [
  "solución eficaz",
  "apoyo completo",
  "apoyo del organismo",
  "apoyo general",
  "estado delicado",
  "solución moderna",
  "fórmula innovadora",
  "producto único",
  "fórmula natural",
  "cuidado de la salud",
  "apoyo a la salud",
  "vitalidad masculina",
  "salud masculina",
  "bienestar general",
  "tono general",
  "calidad de vida",
  "equilibrio natural",
  "acción compleja",
];
