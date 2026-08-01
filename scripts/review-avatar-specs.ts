export type AvatarGender = "m" | "f";

export type ShotType = "selfie" | "friend_photo" | "candid" | "posed";

export type Framing = "close_up" | "half_body" | "full_body";

export type Season = "spring" | "summer" | "autumn" | "winter" | "any";

export type AvatarSpec = {
  id: string;
  gender: AvatarGender;
  age: number;
  season: Season;
  shot: ShotType;
  framing: Framing;
  scenario: string;
  withOthers?: boolean;
  withAnimal?: boolean;
};

const SEASON_HINT: Record<Season, string> = {
  spring: "spring weather, light jacket, fresh green surroundings",
  summer: "summer weather, warm sunlight, light summer clothes",
  autumn: "autumn weather, fallen leaves, mild coat or sweater",
  winter: "winter weather, warm coat or scarf, cold outdoor air",
  any: "everyday clothes for mild weather",
};

const SHOT_HINT: Record<ShotType, string> = {
  selfie: "selfie at arm's length, front-facing phone camera angle",
  friend_photo: "photo taken by a friend from a few steps away, subject looking at camera",
  candid: "candid snapshot, slightly off-center angle as if caught mid-moment",
  posed: "posed for someone else's camera, relaxed natural smile",
};

const FRAMING_HINT: Record<Framing, string> = {
  close_up: "close-up head and shoulders portrait",
  half_body: "half-body shot from waist up",
  full_body:
    "full-body shot but main subject in foreground with face clearly visible and prominent for profile crop",
};

/** 48 specs: f1-f16 + m1-m16 + r1-r16 (8F + 8M in r*). */
export const AVATAR_SPECS: AvatarSpec[] = [
  // f1-f16 (female)
  { id: "f1", gender: "f", age: 38, season: "any", shot: "friend_photo", framing: "half_body", scenario: "home office desk with laptop and books", withOthers: false },
  { id: "f2", gender: "f", age: 42, season: "summer", shot: "candid", framing: "close_up", scenario: "outdoor cafe terrace on a European city street", withOthers: false },
  { id: "f3", gender: "f", age: 47, season: "any", shot: "selfie", framing: "half_body", scenario: "gym mirror, fitness equipment behind", withOthers: false },
  { id: "f4", gender: "f", age: 39, season: "any", shot: "friend_photo", framing: "half_body", scenario: "home kitchen while cooking", withOthers: false },
  { id: "f5", gender: "f", age: 46, season: "spring", shot: "candid", framing: "full_body", scenario: "residential courtyard walk", withAnimal: true, withOthers: false },
  { id: "f6", gender: "f", age: 51, season: "summer", shot: "friend_photo", framing: "half_body", scenario: "hiking trail with forest hills behind", withOthers: false },
  { id: "f7", gender: "f", age: 45, season: "any", shot: "posed", framing: "half_body", scenario: "supermarket entrance with shopping cart", withOthers: false },
  { id: "f8", gender: "f", age: 41, season: "winter", shot: "friend_photo", framing: "half_body", scenario: "snowy city park path", withOthers: true },
  { id: "f9", gender: "f", age: 55, season: "autumn", shot: "candid", framing: "close_up", scenario: "bookstore aisle with shelves blurred", withOthers: false },
  { id: "f10", gender: "f", age: 36, season: "summer", shot: "selfie", framing: "close_up", scenario: "Lake Balaton pier, water and boats behind", withOthers: false },
  { id: "f11", gender: "f", age: 49, season: "any", shot: "friend_photo", framing: "half_body", scenario: "restaurant interior, table and wine glasses blurred", withOthers: true },
  { id: "f12", gender: "f", age: 44, season: "spring", shot: "posed", framing: "close_up", scenario: "zoo walkway near animal enclosure fence", withAnimal: true, withOthers: false },
  { id: "f13", gender: "f", age: 53, season: "winter", shot: "candid", framing: "half_body", scenario: "indoor shopping mall entrance with glass doors", withOthers: false },
  { id: "f14", gender: "f", age: 40, season: "autumn", shot: "friend_photo", framing: "full_body", scenario: "vineyard or countryside road with yellow leaves", withOthers: true },
  { id: "f15", gender: "f", age: 57, season: "summer", shot: "candid", framing: "half_body", scenario: "farmers market stall with fruit crates", withOthers: false },
  { id: "f16", gender: "f", age: 43, season: "any", shot: "selfie", framing: "close_up", scenario: "hair salon mirror after haircut, salon chairs behind", withOthers: false },

  // m1-m16 (male)
  { id: "m1", gender: "m", age: 45, season: "any", shot: "selfie", framing: "half_body", scenario: "garage workshop with tools on shelves", withOthers: false },
  { id: "m2", gender: "m", age: 55, season: "spring", shot: "friend_photo", framing: "half_body", scenario: "golf course fairway or large park lawn", withOthers: false },
  { id: "m3", gender: "m", age: 61, season: "autumn", shot: "candid", framing: "close_up", scenario: "bus stop on commuter street", withOthers: false },
  { id: "m4", gender: "m", age: 57, season: "summer", shot: "friend_photo", framing: "half_body", scenario: "restaurant patio with umbrellas", withOthers: true },
  { id: "m5", gender: "m", age: 53, season: "any", shot: "posed", framing: "close_up", scenario: "Praha city street with tram wires", withOthers: false },
  { id: "m6", gender: "m", age: 50, season: "any", shot: "candid", framing: "half_body", scenario: "hardware store aisle", withOthers: false },
  { id: "m7", gender: "m", age: 49, season: "any", shot: "selfie", framing: "close_up", scenario: "living room sofa, TV glow behind", withOthers: false },
  { id: "m8", gender: "m", age: 46, season: "winter", shot: "friend_photo", framing: "full_body", scenario: "frozen lake fishing spot with gear", withOthers: false },
  { id: "m9", gender: "m", age: 52, season: "summer", shot: "candid", framing: "half_body", scenario: "beer garden with friends at long tables", withOthers: true },
  { id: "m10", gender: "m", age: 48, season: "autumn", shot: "posed", framing: "half_body", scenario: "DIY store entrance with automatic doors", withOthers: false },
  { id: "m11", gender: "m", age: 63, season: "spring", shot: "friend_photo", framing: "close_up", scenario: "zoo path with family in soft background", withAnimal: true, withOthers: true },
  { id: "m12", gender: "m", age: 44, season: "autumn", shot: "candid", framing: "close_up", scenario: "local football pitch sideline during match", withOthers: false },
  { id: "m13", gender: "m", age: 58, season: "winter", shot: "posed", framing: "half_body", scenario: "train station platform with departure board", withOthers: false },
  { id: "m14", gender: "m", age: 51, season: "summer", shot: "friend_photo", framing: "full_body", scenario: "backyard barbecue with grill smoke", withOthers: true },
  { id: "m15", gender: "m", age: 54, season: "spring", shot: "candid", framing: "half_body", scenario: "bike path stop along a river", withOthers: false },
  { id: "m16", gender: "m", age: 47, season: "any", shot: "selfie", framing: "close_up", scenario: "office break room with coffee machine", withOthers: false },

  // r1-r16 (8 female + 8 male)
  { id: "r1", gender: "f", age: 52, season: "spring", shot: "selfie", framing: "close_up", scenario: "balcony with potted plants and morning coffee", withOthers: false },
  { id: "r2", gender: "m", age: 65, season: "summer", shot: "friend_photo", framing: "half_body", scenario: "fishing by a lake, water and reeds behind", withOthers: false },
  { id: "r3", gender: "f", age: 58, season: "autumn", shot: "candid", framing: "half_body", scenario: "park walk among golden trees", withOthers: false },
  { id: "r4", gender: "m", age: 70, season: "summer", shot: "friend_photo", framing: "half_body", scenario: "backyard barbecue, garden fence visible", withOthers: true },
  { id: "r5", gender: "f", age: 60, season: "spring", shot: "posed", framing: "half_body", scenario: "suburban garden with flowers and lawn", withOthers: false },
  { id: "r6", gender: "m", age: 48, season: "any", shot: "candid", framing: "close_up", scenario: "football field sideline, goal posts distant", withOthers: false },
  { id: "r7", gender: "f", age: 44, season: "any", shot: "selfie", framing: "close_up", scenario: "car interior, parking lot through window", withOthers: false },
  { id: "r8", gender: "m", age: 50, season: "spring", shot: "friend_photo", framing: "full_body", scenario: "bike path along river, bicycle nearby", withOthers: false },
  { id: "r9", gender: "f", age: 43, season: "any", shot: "candid", framing: "close_up", scenario: "public library reading area", withOthers: false },
  { id: "r10", gender: "m", age: 55, season: "summer", shot: "posed", framing: "half_body", scenario: "allotment garden with vegetables and shed", withOthers: false },
  { id: "r11", gender: "f", age: 50, season: "winter", shot: "friend_photo", framing: "half_body", scenario: "Christmas market stall with lights blurred", withOthers: true },
  { id: "r12", gender: "m", age: 56, season: "autumn", shot: "candid", framing: "half_body", scenario: "woodworking bench in backyard shed", withOthers: false },
  { id: "r13", gender: "f", age: 48, season: "summer", shot: "posed", framing: "close_up", scenario: "outdoor concert or festival crowd blurred behind", withOthers: true },
  { id: "r14", gender: "m", age: 59, season: "winter", shot: "selfie", framing: "close_up", scenario: "snowy driveway shoveling break", withOthers: false },
  { id: "r15", gender: "f", age: 54, season: "autumn", shot: "friend_photo", framing: "half_body", scenario: "thermal spa outdoor pool area", withOthers: false },
  { id: "r16", gender: "m", age: 62, season: "any", shot: "candid", framing: "close_up", scenario: "pharmacy storefront on high street", withOthers: false },
];

export const NEW_AVATAR_IDS = new Set([
  "f8", "f9", "f10", "f11", "f12", "f13", "f14", "f15", "f16",
  "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16",
  "r11", "r12", "r13", "r14", "r15", "r16",
]);

export function buildPrompt(spec: AvatarSpec): string {
  const genderWord = spec.gender === "f" ? "woman" : "man";
  const parts = [
    `Realistic casual social media photo of a ${spec.age}-year-old Central European ${genderWord}.`,
    SHOT_HINT[spec.shot],
    FRAMING_HINT[spec.framing],
    SEASON_HINT[spec.season],
    `Setting: ${spec.scenario}.`,
  ];

  if (spec.withOthers) {
    parts.push("One or two friends or family members softly blurred in background; main subject in sharp focus.");
  }
  if (spec.withAnimal) {
    parts.push("Pet dog on leash or zoo animals visible in background; main subject remains the clear focus.");
  }

  parts.push(
    "Looks like an authentic Facebook or Instagram profile photo, not a studio headshot.",
    "Natural uneven lighting, slight phone camera grain, shallow depth of field.",
    "Main subject's face clearly visible and large enough for circular avatar crop.",
    "Photorealistic, authentic skin texture, no beauty filter, no AI gloss.",
    "No readable text, logos, or watermarks.",
  );

  return parts.join(" ");
}

export function specById(id: string): AvatarSpec | undefined {
  return AVATAR_SPECS.find((s) => s.id === id);
}
