// src/game/engine/types.ts
var TECH_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7];
var TECH_LEVEL_IDS = [
  "preAgricultural",
  "agricultural",
  "medieval",
  "renaissance",
  "earlyIndustrial",
  "industrial",
  "postIndustrial",
  "hiTech"
];
var STATION_KINDS = ["science", "military", "engineering"];
var SHIP_SIZES = ["small", "medium", "large", "capital"];
var SHIP_CLASSES = ["military", "trade", "civilian", "explorer", "industrial"];
var CREW_ROLES = ["pilot", "gunner", "mechanic", "electrician"];
var PROFESSIONS = [
  "pilot",
  "gunner",
  "mechanic",
  "electrician",
  "trader",
  "generalist"
];

// src/game/engine/rng.ts
var Rng = class {
  state;
  constructor(seed) {
    this.state = seed >>> 0;
  }
  /** Float in [0, 1). */
  next() {
    this.state = this.state + 1831565813 | 0;
    let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Random element of an array. */
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }
  /** True with the given probability (0..1). */
  chance(p) {
    return this.next() < p;
  }
  /** Random sign-symmetric variance: value in [-v, v]. */
  variance(v) {
    return this.int(-v, v);
  }
};
function randomSeed() {
  return Math.floor(Math.random() * 4294967295) >>> 0;
}

// src/game/data/politics.ts
var POLITICS = {
  anarchy: {
    id: "anarchy",
    strengthPolice: 0,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 7,
    wanted: "food",
    forbidden: []
  },
  capitalist: {
    id: "capitalist",
    strengthPolice: 2,
    strengthPirates: 1,
    strengthTraders: 7,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 1,
    wanted: "ore",
    forbidden: []
  },
  communist: {
    id: "communist",
    strengthPolice: 6,
    strengthPirates: 4,
    strengthTraders: 4,
    minTechLevel: 1,
    maxTechLevel: 5,
    bribeLevel: 5,
    wanted: null,
    forbidden: []
  },
  confederacy: {
    id: "confederacy",
    strengthPolice: 5,
    strengthPirates: 3,
    strengthTraders: 5,
    minTechLevel: 1,
    maxTechLevel: 6,
    bribeLevel: 3,
    wanted: "games",
    forbidden: []
  },
  corporate: {
    id: "corporate",
    strengthPolice: 6,
    strengthPirates: 2,
    strengthTraders: 7,
    minTechLevel: 5,
    maxTechLevel: 7,
    bribeLevel: 2,
    wanted: "robots",
    forbidden: []
  },
  cybernetic: {
    id: "cybernetic",
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 5,
    minTechLevel: 6,
    maxTechLevel: 7,
    bribeLevel: 0,
    wanted: "ore",
    forbidden: ["firearms", "narcotics"]
  },
  democracy: {
    id: "democracy",
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 5,
    minTechLevel: 3,
    maxTechLevel: 7,
    bribeLevel: 2,
    wanted: "games",
    forbidden: []
  },
  dictatorship: {
    id: "dictatorship",
    strengthPolice: 4,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 7,
    bribeLevel: 6,
    wanted: null,
    forbidden: []
  },
  fascist: {
    id: "fascist",
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 0,
    wanted: "machines",
    forbidden: ["narcotics"]
  },
  feudal: {
    id: "feudal",
    strengthPolice: 1,
    strengthPirates: 6,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 3,
    bribeLevel: 6,
    wanted: "firearms",
    forbidden: []
  },
  military: {
    id: "military",
    strengthPolice: 7,
    strengthPirates: 0,
    strengthTraders: 6,
    minTechLevel: 2,
    maxTechLevel: 7,
    bribeLevel: 0,
    wanted: "robots",
    forbidden: ["narcotics"]
  },
  monarchy: {
    id: "monarchy",
    strengthPolice: 4,
    strengthPirates: 3,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 4,
    wanted: "medicine",
    forbidden: []
  },
  pacifist: {
    id: "pacifist",
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 3,
    bribeLevel: 1,
    wanted: null,
    forbidden: ["firearms"]
  },
  socialist: {
    id: "socialist",
    strengthPolice: 2,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 6,
    wanted: null,
    forbidden: []
  },
  satori: {
    id: "satori",
    strengthPolice: 1,
    strengthPirates: 1,
    strengthTraders: 1,
    minTechLevel: 0,
    maxTechLevel: 1,
    bribeLevel: 0,
    wanted: null,
    forbidden: ["firearms", "narcotics"]
  },
  technocracy: {
    id: "technocracy",
    strengthPolice: 6,
    strengthPirates: 3,
    strengthTraders: 6,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 2,
    wanted: "water",
    forbidden: []
  },
  theocracy: {
    id: "theocracy",
    strengthPolice: 6,
    strengthPirates: 1,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 4,
    bribeLevel: 0,
    wanted: "narcotics",
    forbidden: ["firearms", "narcotics"]
  }
};
var POLITICS_IDS = Object.keys(POLITICS);

// src/game/data/economies.ts
var ECONOMIES = {
  agricultural: {
    id: "agricultural",
    goods: {
      food: 0.6,
      water: 0.7,
      furs: 0.8,
      games: 1.1,
      machines: 1.35,
      robots: 1.3,
      firearms: 1.25,
      medicine: 1.1
    },
    fuelCostMul: 0.9,
    techMin: 0,
    techMax: 4
  },
  mining: {
    id: "mining",
    goods: {
      ore: 0.6,
      firearms: 0.95,
      water: 1.15,
      food: 1.2,
      machines: 1.15,
      robots: 1.1
    },
    fuelCostMul: 0.85,
    techMin: 0,
    techMax: 5
  },
  industrial: {
    id: "industrial",
    goods: {
      machines: 0.7,
      robots: 0.75,
      firearms: 0.8,
      ore: 0.9,
      food: 1.25,
      water: 1.2,
      furs: 1.1
    },
    fuelCostMul: 0.8,
    techMin: 3,
    techMax: 7
  },
  refinery: {
    id: "refinery",
    goods: {
      ore: 0.85,
      machines: 0.95,
      narcotics: 0.9,
      medicine: 1.05,
      food: 1.15,
      water: 1.1
    },
    fuelCostMul: 0.55,
    techMin: 3,
    techMax: 7
  },
  resort: {
    id: "resort",
    goods: {
      games: 0.65,
      furs: 0.9,
      medicine: 0.95,
      narcotics: 1.25,
      food: 1.35,
      water: 1.35
    },
    fuelCostMul: 1.4,
    techMin: 2,
    techMax: 7
  },
  hiTech: {
    id: "hiTech",
    goods: {
      robots: 0.65,
      medicine: 0.75,
      machines: 0.8,
      games: 0.9,
      firearms: 0.85,
      ore: 1.1,
      water: 1.25,
      food: 1.2
    },
    fuelCostMul: 0.9,
    techMin: 5,
    techMax: 7
  }
};
var ECONOMY_IDS = Object.keys(ECONOMIES);
function economyOf(id) {
  return ECONOMIES[id] ?? ECONOMIES.agricultural;
}

// src/game/data/systemNames.ts
var SYSTEM_NAMES = [
  "Acamar",
  "Adahn",
  "Aldea",
  "Andevian",
  "Antedi",
  "Balosnee",
  "Baratas",
  "Brax",
  "Bretel",
  "Calondia",
  "Campor",
  "Capelle",
  "Carzon",
  "Castor",
  "Cestus",
  "Cheron",
  "Courteney",
  "Daled",
  "Damast",
  "Davlos",
  "Deneb",
  "Deneva",
  "Devidia",
  "Draylon",
  "Drema",
  "Endor",
  "Esmee",
  "Exo",
  "Ferris",
  "Festen",
  "Fourmi",
  "Frolix",
  "Gemulon",
  "Guinifer",
  "Hades",
  "Hamlet",
  "Helena",
  "Hulst",
  "Iodine",
  "Iralius",
  "Janus",
  "Japori",
  "Jarada",
  "Jason",
  "Kaylon",
  "Khefka",
  "Kira",
  "Klaatu",
  "Klaestron",
  "Korma",
  "Kravat",
  "Krios",
  "Laertes",
  "Largo",
  "Lave",
  "Ligon",
  "Lowry",
  "Magrat",
  "Malcoria",
  "Melina",
  "Mentar",
  "Merik",
  "Mintaka",
  "Montor",
  "Mordan",
  "Myrthe",
  "Nelvana",
  "Nix",
  "Nyle",
  "Odet",
  "Og",
  "Omega",
  "Omphalos",
  "Orias",
  "Othello",
  "Parade",
  "Penthara",
  "Picard",
  "Pollux",
  "Quator",
  "Rakhar",
  "Ran",
  "Regulas",
  "Relva",
  "Rhymus",
  "Rochani",
  "Rubicum",
  "Rutia",
  "Sarpeidon",
  "Sefalla",
  "Seltrice",
  "Sigma",
  "Sol",
  "Somari",
  "Stakoron",
  "Styris",
  "Talani",
  "Tarchannen",
  "Terosa",
  "Thera",
  "Titan",
  "Torin",
  "Triacus",
  "Turkana",
  "Tyrus",
  "Umberlee",
  "Utopia",
  "Vadera",
  "Vagra",
  "Vandor",
  "Ventax",
  "Xenon",
  "Xerxes",
  "Yew",
  "Yojimbo",
  "Zalkon",
  "Zuul",
  // Second wave, added when the galaxy grew past a hundred systems.
  "Abraxas",
  "Aegis",
  "Ahriman",
  "Alcor",
  "Amaranth",
  "Anshar",
  "Aquila",
  "Arcturus",
  "Ashkelon",
  "Avalon",
  "Bellatrix",
  "Beshara",
  "Caldera",
  "Callisto",
  "Carinae",
  "Cyrene",
  "Dagon",
  "Delvaux",
  "Dionne",
  "Elara",
  "Elysia",
  "Enkidu",
  "Erebus",
  "Fomalhaut",
  "Gallia",
  "Ganymede",
  "Halcyon",
  "Hesperia",
  "Ilion",
  "Inari",
  "Ishtar",
  "Kalima",
  "Karnak",
  "Kestrel",
  "Kobol",
  "Lacerta",
  "Lorien",
  "Lumen",
  "Marisol",
  "Meridian",
  "Mycenae",
  "Nadira",
  "Nautilus",
  "Nemain",
  "Nokomis",
  "Obsidia",
  "Onyx",
  "Ophira",
  "Palatine",
  "Perdita",
  "Phaeton",
  "Quillon",
  "Rhadamant",
  "Sabik",
  "Salara",
  "Sanctus",
  "Selene",
  "Serafim",
  "Solveig",
  "Tanager",
  "Tashkent",
  "Thalassa",
  "Tindalos",
  "Ursa",
  "Valdris",
  "Verity",
  "Vespera",
  "Wexford",
  "Yarrow",
  "Zephyra"
];

// src/game/data/goods.ts
var TRADE_GOODS = {
  water: {
    id: "water",
    techProduction: 0,
    techUsage: 0,
    basePrice: 30,
    pricePerTech: 3,
    variance: 4,
    spikeStatus: "drought",
    cheapResource: "sweetwater",
    expensiveResource: "desert",
    illegal: false,
    minPrice: 30,
    maxPrice: 54
  },
  furs: {
    id: "furs",
    techProduction: 0,
    techUsage: 0,
    basePrice: 250,
    pricePerTech: 10,
    variance: 10,
    spikeStatus: "cold",
    cheapResource: "richFauna",
    expensiveResource: "lifeless",
    illegal: false,
    minPrice: 250,
    maxPrice: 320
  },
  food: {
    id: "food",
    techProduction: 1,
    techUsage: 0,
    basePrice: 105,
    pricePerTech: 5,
    variance: 5,
    spikeStatus: "cropFailure",
    cheapResource: "richSoil",
    expensiveResource: "poorSoil",
    illegal: false,
    minPrice: 105,
    maxPrice: 135
  },
  ore: {
    id: "ore",
    techProduction: 2,
    techUsage: 2,
    basePrice: 350,
    pricePerTech: 20,
    variance: 10,
    spikeStatus: "war",
    cheapResource: "mineralRich",
    expensiveResource: "mineralPoor",
    illegal: false,
    minPrice: 390,
    maxPrice: 490
  },
  games: {
    id: "games",
    techProduction: 3,
    techUsage: 1,
    basePrice: 250,
    pricePerTech: -10,
    variance: 5,
    spikeStatus: "boredom",
    cheapResource: "artistic",
    expensiveResource: null,
    illegal: false,
    minPrice: 180,
    maxPrice: 240
  },
  firearms: {
    id: "firearms",
    techProduction: 3,
    techUsage: 1,
    basePrice: 1250,
    pricePerTech: -75,
    variance: 100,
    spikeStatus: "war",
    cheapResource: "warlike",
    expensiveResource: null,
    illegal: true,
    minPrice: 725,
    maxPrice: 1175
  },
  medicine: {
    id: "medicine",
    techProduction: 4,
    techUsage: 1,
    basePrice: 650,
    pricePerTech: -20,
    variance: 10,
    spikeStatus: "plague",
    cheapResource: "lotsOfHerbs",
    expensiveResource: null,
    illegal: false,
    minPrice: 510,
    maxPrice: 630
  },
  machines: {
    id: "machines",
    techProduction: 4,
    techUsage: 3,
    basePrice: 900,
    pricePerTech: -30,
    variance: 5,
    spikeStatus: "lackOfWorkers",
    cheapResource: null,
    expensiveResource: null,
    illegal: false,
    minPrice: 690,
    maxPrice: 810
  },
  narcotics: {
    id: "narcotics",
    techProduction: 5,
    techUsage: 0,
    basePrice: 3500,
    pricePerTech: -125,
    variance: 150,
    spikeStatus: "boredom",
    cheapResource: "weirdMushrooms",
    expensiveResource: null,
    illegal: true,
    minPrice: 2625,
    maxPrice: 3500
  },
  robots: {
    id: "robots",
    techProduction: 6,
    techUsage: 4,
    basePrice: 5e3,
    pricePerTech: -150,
    variance: 100,
    spikeStatus: "lackOfWorkers",
    cheapResource: null,
    expensiveResource: null,
    illegal: false,
    minPrice: 3950,
    maxPrice: 4400
  },
  // --- Exotic goods: produced only at a source special resource, wanted where
  // the complementary resource (or hi-tech demand) exists. ---
  gems: exotic("gems", 900, "mineralRich", "mineralPoor"),
  springWater: exotic("springWater", 220, "sweetwater", "desert"),
  delicacies: exotic("delicacies", 350, "richSoil", "poorSoil"),
  pelts: exotic("pelts", 650, "richFauna", "lifeless"),
  mushrooms: exotic("mushrooms", 1300, "weirdMushrooms"),
  herbs: exotic("herbs", 480, "lotsOfHerbs"),
  artwork: exotic("artwork", 1600, "artistic"),
  relics: exotic("relics", 2100, "warlike")
};
function exotic(id, basePrice, producedByResource, wantedByResource) {
  return {
    id,
    techProduction: 0,
    techUsage: 0,
    basePrice,
    pricePerTech: 0,
    variance: Math.round(basePrice * 0.06),
    spikeStatus: null,
    cheapResource: null,
    expensiveResource: null,
    illegal: false,
    minPrice: Math.round(basePrice * 0.4),
    maxPrice: Math.round(basePrice * 1.6),
    producedByResource,
    wantedByResource
  };
}
var GOOD_IDS = Object.keys(TRADE_GOODS);
var SPECIAL_GOOD_IDS = GOOD_IDS.filter(
  (id) => TRADE_GOODS[id].producedByResource !== void 0
);
function isSpecialGood(id) {
  return TRADE_GOODS[id].producedByResource !== void 0;
}

// src/game/data/mercenaries.ts
var MERCENARIES = {
  alyssa: { id: "alyssa", profession: "pilot", skills: { pilot: 9, fighter: 4, trader: 3, engineer: 5, electrician: 4 }, wage: 55 },
  bran: { id: "bran", profession: "gunner", skills: { pilot: 3, fighter: 9, trader: 2, engineer: 4, electrician: 3 }, wage: 55 },
  cyra: { id: "cyra", profession: "trader", skills: { pilot: 5, fighter: 3, trader: 9, engineer: 4, electrician: 4 }, wage: 55 },
  dex: { id: "dex", profession: "mechanic", skills: { pilot: 4, fighter: 4, trader: 3, engineer: 9, electrician: 6 }, wage: 60 },
  elin: { id: "elin", profession: "pilot", skills: { pilot: 7, fighter: 7, trader: 4, engineer: 5, electrician: 5 }, wage: 70 },
  ferro: { id: "ferro", profession: "gunner", skills: { pilot: 5, fighter: 8, trader: 3, engineer: 7, electrician: 5 }, wage: 70 },
  gwen: { id: "gwen", profession: "electrician", skills: { pilot: 6, fighter: 3, trader: 7, engineer: 6, electrician: 8 }, wage: 70 },
  hoshi: { id: "hoshi", profession: "pilot", skills: { pilot: 8, fighter: 5, trader: 5, engineer: 6, electrician: 5 }, wage: 75 },
  ivo: { id: "ivo", profession: "electrician", skills: { pilot: 2, fighter: 6, trader: 6, engineer: 6, electrician: 9 }, wage: 65 },
  juno: { id: "juno", profession: "generalist", skills: { pilot: 6, fighter: 6, trader: 6, engineer: 6, electrician: 6 }, wage: 85 },
  kai: { id: "kai", profession: "trader", skills: { pilot: 4, fighter: 5, trader: 8, engineer: 5, electrician: 3 }, wage: 65 },
  lena: { id: "lena", profession: "mechanic", skills: { pilot: 7, fighter: 4, trader: 4, engineer: 8, electrician: 7 }, wage: 75 },
  mira: { id: "mira", profession: "generalist", skills: { pilot: 3, fighter: 3, trader: 5, engineer: 4, electrician: 4 }, wage: 40 },
  nox: { id: "nox", profession: "gunner", skills: { pilot: 5, fighter: 10, trader: 2, engineer: 5, electrician: 2 }, wage: 90 },
  orin: { id: "orin", profession: "pilot", skills: { pilot: 10, fighter: 6, trader: 4, engineer: 7, electrician: 5 }, wage: 95 },
  pax: { id: "pax", profession: "generalist", skills: { pilot: 4, fighter: 4, trader: 4, engineer: 4, electrician: 4 }, wage: 35 },
  quen: { id: "quen", profession: "electrician", skills: { pilot: 6, fighter: 6, trader: 5, engineer: 5, electrician: 8 }, wage: 75 },
  rhea: { id: "rhea", profession: "pilot", skills: { pilot: 8, fighter: 4, trader: 6, engineer: 5, electrician: 4 }, wage: 70 },
  sol: { id: "sol", profession: "mechanic", skills: { pilot: 5, fighter: 5, trader: 5, engineer: 9, electrician: 8 }, wage: 85 },
  tavi: { id: "tavi", profession: "pilot", skills: { pilot: 9, fighter: 5, trader: 3, engineer: 6, electrician: 3 }, wage: 80 },
  ulf: { id: "ulf", profession: "gunner", skills: { pilot: 3, fighter: 9, trader: 4, engineer: 6, electrician: 4 }, wage: 75 },
  vera: { id: "vera", profession: "trader", skills: { pilot: 6, fighter: 6, trader: 9, engineer: 4, electrician: 5 }, wage: 80 },
  wren: { id: "wren", profession: "electrician", skills: { pilot: 7, fighter: 3, trader: 6, engineer: 7, electrician: 9 }, wage: 80 },
  xara: { id: "xara", profession: "mechanic", skills: { pilot: 5, fighter: 8, trader: 5, engineer: 8, electrician: 6 }, wage: 95 },
  yuki: { id: "yuki", profession: "gunner", skills: { pilot: 8, fighter: 8, trader: 5, engineer: 7, electrician: 7 }, wage: 110 },
  zane: { id: "zane", profession: "pilot", skills: { pilot: 10, fighter: 9, trader: 6, engineer: 8, electrician: 7 }, wage: 140 }
};
var MERCENARY_IDS = Object.keys(MERCENARIES);
function mercenaryWorth(m) {
  return m.skills.pilot + m.skills.fighter + m.skills.trader + m.skills.engineer + m.skills.electrician;
}

// src/game/engine/galaxy.ts
var GALAXY_WIDTH = 260;
var GALAXY_HEIGHT = 190;
var SYSTEM_COUNT = 140;
var MIN_SYSTEM_DISTANCE = 8;
var WORMHOLE_PAIRS = 12;
var UNSTABLE_WORMHOLES = 14;
var MAX_SYSTEM_BODIES = 7;
var SPECIAL_RESOURCES = [
  "none",
  "none",
  "none",
  // weight "none" more heavily
  "mineralRich",
  "mineralPoor",
  "desert",
  "sweetwater",
  "richSoil",
  "poorSoil",
  "richFauna",
  "lifeless",
  "weirdMushrooms",
  "lotsOfHerbs",
  "artistic",
  "warlike"
];
var STATUSES = [
  "uneventful",
  "uneventful",
  "uneventful",
  "uneventful",
  "uneventful",
  "uneventful",
  "uneventful",
  "uneventful",
  "uneventful",
  "uneventful",
  "war",
  "plague",
  "drought",
  "boredom",
  "cold",
  "cropFailure",
  "lackOfWorkers"
];
var STAR_CLASSES = [
  "blue",
  "white",
  "white",
  "yellow",
  "yellow",
  "yellow",
  "orange",
  "orange",
  "red",
  "red"
];
var BARREN_TERRAINS = [
  "asteroidBelt",
  "gasGiant",
  "iceMoon",
  "rockyMoon",
  "lavaWorld",
  "dustWorld"
];
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function shuffled(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickPolitics(rng, tech) {
  const valid = POLITICS_IDS.filter((id) => {
    const p = POLITICS[id];
    return tech >= p.minTechLevel && tech <= p.maxTechLevel;
  });
  return valid.length ? rng.pick(valid) : "anarchy";
}
function pickMineSite(rng, resource) {
  if (resource === "mineralRich") return { kind: "asteroidField", resource: "ore", richness: 12 };
  if (resource === "mineralPoor" || resource === "lifeless")
    return { kind: "asteroidField", resource: "ore", richness: 7 };
  if (resource === "sweetwater") return { kind: "iceField", resource: "water", richness: 12 };
  if (rng.chance(0.22)) return { kind: "gasGiant", resource: "fuel", richness: 10 };
  return null;
}
function mineSiteForTerrain(terrain, rng) {
  switch (terrain) {
    case "asteroidBelt":
      return { kind: "asteroidField", resource: "ore", richness: rng.int(9, 15) };
    case "gasGiant":
      return { kind: "gasGiant", resource: "fuel", richness: rng.int(8, 14) };
    case "iceMoon":
      return { kind: "iceField", resource: "water", richness: rng.int(8, 14) };
    case "lavaWorld":
      return { kind: "asteroidField", resource: "ore", richness: rng.int(5, 10) };
    default:
      return null;
  }
}
function pickStationKind(rng, tech, politics, economy) {
  const weights = [
    ["science", tech >= 6 ? 4 : 1],
    [
      "military",
      politics === "military" || politics === "dictatorship" || politics === "fascist" ? 5 : 1
    ],
    ["engineering", economy === "industrial" || economy === "refinery" || economy === "mining" ? 4 : 1]
  ];
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng.int(0, total - 1);
  for (const [kind, w] of weights) {
    if (roll < w) return kind;
    roll -= w;
  }
  return "science";
}
function generateBodies(rng, sys) {
  const bodies = [];
  const count = rng.int(2, MAX_SYSTEM_BODIES);
  const orbits = shuffled([1, 2, 3, 4, 5, 6, 7, 8], rng).slice(0, count).sort((a, b) => a - b);
  const capitalIndex = count > 2 ? rng.int(0, Math.min(count - 1, 2)) : rng.int(0, count - 1);
  const hasStation = rng.chance(0.3);
  const stationIndex = hasStation ? shuffled(
    Array.from({ length: count }, (_, i) => i).filter((i) => i !== capitalIndex),
    rng
  )[0] : -1;
  for (let i = 0; i < count; i++) {
    const orbit = orbits[i];
    const angle = rng.next();
    if (i === capitalIndex) {
      bodies.push({ id: 0, kind: "planet", orbit, angle, mineSite: null });
      continue;
    }
    if (i === stationIndex) {
      bodies.push({
        id: 0,
        kind: "station",
        orbit,
        angle,
        station: pickStationKind(rng, sys.techLevel, sys.politics, sys.economyType),
        mineSite: null
      });
      continue;
    }
    const terrain = rng.pick(BARREN_TERRAINS);
    bodies.push({
      id: 0,
      kind: "barren",
      orbit,
      angle,
      terrain,
      mineSite: mineSiteForTerrain(terrain, rng)
    });
  }
  const capital = bodies.splice(capitalIndex, 1)[0];
  bodies.unshift(capital);
  bodies.forEach((b, i) => b.id = i);
  return bodies;
}
function ensureBodies(seed, systems) {
  for (const sys of systems) {
    if (sys.bodies && sys.bodies.length > 0 && sys.starClass) continue;
    const rng = new Rng((seed ^ (sys.id + 1) * 2654435761) >>> 0);
    if (!sys.starClass) sys.starClass = rng.pick(STAR_CLASSES);
    if (!sys.bodies || sys.bodies.length === 0) sys.bodies = generateBodies(rng, sys);
  }
}
function pickEconomy(rng, tech) {
  const valid = ECONOMY_IDS.filter((id) => {
    const e = ECONOMIES[id];
    return tech >= e.techMin && tech <= e.techMax;
  });
  return valid.length ? rng.pick(valid) : "agricultural";
}
function emptyGoodRecord() {
  const rec = {};
  for (const g of GOOD_IDS) rec[g] = 0;
  return rec;
}
function generateGalaxy(seed) {
  const rng = new Rng(seed);
  const systems = [];
  const names = shuffled(SYSTEM_NAMES, rng);
  let attempts = 0;
  while (systems.length < SYSTEM_COUNT && attempts < SYSTEM_COUNT * 200) {
    attempts++;
    const x = rng.int(10, GALAXY_WIDTH - 10);
    const y = rng.int(10, GALAXY_HEIGHT - 10);
    if (systems.some((s) => distance(s, { x, y }) < MIN_SYSTEM_DISTANCE)) continue;
    const tech = rng.int(0, 7);
    const politics = pickPolitics(rng, tech);
    const id = systems.length;
    const specialResource = rng.pick(SPECIAL_RESOURCES);
    const economyType = pickEconomy(rng, tech);
    const mineSite = pickMineSite(rng, specialResource);
    const sys = {
      id,
      nameId: names[id % names.length],
      x,
      y,
      techLevel: tech,
      politics,
      specialResource,
      economyType,
      mineSite,
      starClass: rng.pick(STAR_CLASSES),
      status: rng.pick(STATUSES),
      qty: emptyGoodRecord(),
      buyPrice: emptyGoodRecord(),
      sellPrice: emptyGoodRecord(),
      visited: false,
      wormholeTo: null,
      mercenaryIds: [],
      questBoard: [],
      news: []
    };
    sys.bodies = generateBodies(rng, sys);
    systems.push(sys);
  }
  for (const sys of systems) {
    const size = rng.int(1, 3);
    const hall = [];
    while (hall.length < size) {
      const id = rng.pick(MERCENARY_IDS);
      if (!hall.includes(id)) hall.push(id);
    }
    sys.mercenaryIds = hall;
  }
  const pool = shuffled(systems, rng);
  for (let i = 0; i + 1 < WORMHOLE_PAIRS * 2 && i + 1 < pool.length; i += 2) {
    pool[i].wormholeTo = pool[i + 1].id;
    pool[i + 1].wormholeTo = pool[i].id;
  }
  let placed = 0;
  for (const sys of pool) {
    if (placed >= UNSTABLE_WORMHOLES) break;
    if (sys.wormholeTo !== null) continue;
    sys.unstableWormhole = true;
    placed++;
  }
  return systems;
}

// src/game/engine/market.ts
function standardPrice(good, sys) {
  if (good.producedByResource) {
    return sys.specialResource === good.producedByResource ? Math.round(good.basePrice * 0.5) : 0;
  }
  if (sys.techLevel < good.techProduction) return 0;
  return marketValue(good, sys);
}
function marketValue(good, sys) {
  let price = good.basePrice + sys.techLevel * good.pricePerTech;
  if (good.cheapResource && sys.specialResource === good.cheapResource) {
    price = Math.round(price * 3 / 4);
  }
  if (good.expensiveResource && sys.specialResource === good.expensiveResource) {
    price = Math.round(price * 4 / 3);
  }
  if (good.spikeStatus && sys.status === good.spikeStatus) {
    price = Math.round(price * 1.5);
  }
  const econMul = economyOf(sys.economyType).goods[good.id];
  if (econMul !== void 0) price = Math.round(price * econMul);
  const gov = POLITICS[sys.politics];
  if (gov.wanted === good.id) price = Math.round(price * 1.15);
  return Math.max(0, price);
}
function refreshMarket(sys, rng) {
  const gov = POLITICS[sys.politics];
  for (const id of GOOD_IDS) {
    const good = TRADE_GOODS[id];
    const base = standardPrice(good, sys);
    if (base <= 0) {
      sys.qty[id] = 0;
      sys.buyPrice[id] = 0;
      sys.sellPrice[id] = sellablePrice(good, sys, gov, 0, rng);
      continue;
    }
    const supply = good.producedByResource ? rng.int(3, 15) : Math.max(0, (sys.techLevel + 1) * rng.int(3, 12));
    sys.qty[id] = supply;
    const fluct = rng.variance(good.variance);
    const buy = Math.max(good.minPrice > 0 ? Math.round(good.minPrice / 2) : 1, base + fluct);
    sys.buyPrice[id] = buy;
    sys.sellPrice[id] = sellablePrice(good, sys, gov, buy, rng);
  }
}
function sellablePrice(good, sys, gov, buy, rng) {
  if (good.producedByResource) {
    if (sys.specialResource === good.producedByResource) return 0;
    const complementary = !!good.wantedByResource && sys.specialResource === good.wantedByResource;
    if (!complementary && sys.techLevel < 6) return 0;
    let price = good.basePrice * (0.9 + sys.techLevel * 0.03);
    if (complementary) price *= 1.6;
    return Math.max(1, Math.round(price + rng.variance(good.variance)));
  }
  if (gov.forbidden.includes(good.id)) return 0;
  if (sys.techLevel < good.techUsage) return 0;
  const reference = buy > 0 ? buy : marketValue(good, sys);
  if (reference <= 0) return 0;
  const fluct = rng.variance(good.variance);
  return Math.max(1, Math.round(reference * 0.92) + fluct);
}
function buyableGoods(sys) {
  return GOOD_IDS.filter((id) => sys.buyPrice[id] > 0 && sys.qty[id] > 0);
}

// src/game/data/ships.ts
var SLOT_TABLE = {
  small: {
    military: { w: 2, s: 1, g: 1 },
    trade: { w: 1, s: 1, g: 2 },
    civilian: { w: 1, s: 1, g: 1 },
    explorer: { w: 1, s: 1, g: 3 },
    industrial: { w: 1, s: 2, g: 1 }
  },
  medium: {
    military: { w: 3, s: 2, g: 1 },
    trade: { w: 1, s: 2, g: 3 },
    civilian: { w: 2, s: 2, g: 2 },
    explorer: { w: 1, s: 2, g: 4 },
    industrial: { w: 1, s: 3, g: 2 }
  },
  large: {
    military: { w: 4, s: 3, g: 2 },
    trade: { w: 2, s: 2, g: 4 },
    civilian: { w: 2, s: 3, g: 3 },
    explorer: { w: 2, s: 2, g: 5 },
    industrial: { w: 2, s: 4, g: 3 }
  },
  capital: {
    military: { w: 5, s: 4, g: 2 },
    trade: { w: 2, s: 3, g: 5 },
    civilian: { w: 3, s: 4, g: 4 },
    explorer: { w: 2, s: 3, g: 6 },
    industrial: { w: 2, s: 5, g: 4 }
  }
};
function slotsFor(size, cls) {
  const s = SLOT_TABLE[size][cls];
  return { weaponSlots: s.w, shieldSlots: s.s, gadgetSlots: s.g };
}
var SIZE_RANK = {
  small: 0,
  medium: 1,
  large: 2,
  capital: 3
};
var CREW_TABLE = {
  small: { quarters: 2, minCrew: 2 },
  medium: { quarters: 4, minCrew: 3 },
  large: { quarters: 7, minCrew: 5 },
  capital: { quarters: 10, minCrew: 7 }
};
function crewFor(size) {
  const c = CREW_TABLE[size];
  return { crewQuarters: c.quarters, minCrew: c.minCrew };
}
var SOLO_CREW = { crewQuarters: 1, minCrew: 1 };
var SHIP_TYPES = {
  flea: {
    // The only hull certified for single-handed flight, which makes it both the
    // starting ship and what an escape pod drops you into.
    id: "flea",
    size: "small",
    shipClass: "trade",
    price: 2e3,
    cargoBays: 10,
    ...slotsFor("small", "trade"),
    // W1 S1 G2
    ...SOLO_CREW,
    fuelTanks: 20,
    hullStrength: 60,
    fuelCostPerParsec: 1,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  gnat: {
    id: "gnat",
    size: "small",
    shipClass: "civilian",
    price: 1e4,
    cargoBays: 15,
    ...slotsFor("small", "civilian"),
    // W1 S1 G1
    ...crewFor("small"),
    fuelTanks: 14,
    hullStrength: 100,
    fuelCostPerParsec: 2,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  ant: {
    // Early mining tug: sturdy shields for its size and room for ore.
    id: "ant",
    size: "small",
    shipClass: "industrial",
    price: 14e3,
    cargoBays: 20,
    ...slotsFor("small", "industrial"),
    // W1 S2 G1
    ...crewFor("small"),
    fuelTanks: 14,
    hullStrength: 90,
    fuelCostPerParsec: 3,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  dragonfly: {
    // Nimble long-range scout: little cargo, but reaches far and carries gadgets.
    id: "dragonfly",
    size: "small",
    shipClass: "explorer",
    price: 16e3,
    cargoBays: 12,
    ...slotsFor("small", "explorer"),
    // W1 S1 G3
    ...crewFor("small"),
    fuelTanks: 20,
    hullStrength: 70,
    fuelCostPerParsec: 2,
    repairCostPerUnit: 1,
    minTechLevel: 4
  },
  ladybird: {
    // Cheap escort fighter: two guns on a tough little hull.
    id: "ladybird",
    size: "small",
    shipClass: "military",
    price: 2e4,
    cargoBays: 12,
    ...slotsFor("small", "military"),
    // W2 S1 G1
    ...crewFor("small"),
    fuelTanks: 13,
    hullStrength: 110,
    fuelCostPerParsec: 3,
    repairCostPerUnit: 1,
    minTechLevel: 5
  },
  firefly: {
    id: "firefly",
    size: "medium",
    shipClass: "trade",
    price: 25e3,
    cargoBays: 20,
    ...slotsFor("medium", "trade"),
    // W1 S2 G3
    ...crewFor("medium"),
    fuelTanks: 17,
    hullStrength: 100,
    fuelCostPerParsec: 3,
    repairCostPerUnit: 1,
    minTechLevel: 5
  },
  mosquito: {
    id: "mosquito",
    size: "medium",
    shipClass: "military",
    price: 3e4,
    cargoBays: 15,
    ...slotsFor("medium", "military"),
    // W3 S2 G1
    ...crewFor("medium"),
    fuelTanks: 13,
    hullStrength: 100,
    fuelCostPerParsec: 5,
    repairCostPerUnit: 1,
    minTechLevel: 5
  },
  weevil: {
    // Mid-game mining barge: heavy shields shrug off raiders over the ore fields.
    id: "weevil",
    size: "medium",
    shipClass: "industrial",
    price: 4e4,
    cargoBays: 35,
    ...slotsFor("medium", "industrial"),
    // W1 S3 G2
    ...crewFor("medium"),
    fuelTanks: 13,
    hullStrength: 120,
    fuelCostPerParsec: 7,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  locust: {
    // Cheap swarm hauler: big hold, thin hull — a courier's workhorse.
    id: "locust",
    size: "medium",
    shipClass: "trade",
    price: 45e3,
    cargoBays: 45,
    ...slotsFor("medium", "trade"),
    // W1 S2 G3
    ...crewFor("medium"),
    fuelTanks: 15,
    hullStrength: 80,
    fuelCostPerParsec: 8,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  moth: {
    // Long-range survey ship: modest hold, deep tanks and a rack of gadget bays.
    id: "moth",
    size: "medium",
    shipClass: "explorer",
    price: 55e3,
    cargoBays: 15,
    ...slotsFor("medium", "explorer"),
    // W1 S2 G4
    ...crewFor("medium"),
    fuelTanks: 21,
    hullStrength: 90,
    fuelCostPerParsec: 4,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  bumblebee: {
    id: "bumblebee",
    size: "medium",
    shipClass: "civilian",
    price: 6e4,
    cargoBays: 20,
    ...slotsFor("medium", "civilian"),
    // W2 S2 G2
    ...crewFor("medium"),
    fuelTanks: 15,
    hullStrength: 100,
    fuelCostPerParsec: 7,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  beetle: {
    id: "beetle",
    size: "medium",
    shipClass: "trade",
    price: 8e4,
    cargoBays: 50,
    ...slotsFor("medium", "trade"),
    // W1 S2 G3
    ...crewFor("medium"),
    fuelTanks: 14,
    hullStrength: 50,
    fuelCostPerParsec: 10,
    repairCostPerUnit: 2,
    minTechLevel: 5
  },
  mantis: {
    // Dedicated mid-game fighter: four guns, solid shields, tough hull.
    id: "mantis",
    size: "large",
    shipClass: "military",
    price: 95e3,
    cargoBays: 18,
    ...slotsFor("large", "military"),
    // W4 S3 G2
    ...crewFor("large"),
    fuelTanks: 16,
    hullStrength: 140,
    fuelCostPerParsec: 12,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  hornet: {
    id: "hornet",
    size: "large",
    shipClass: "military",
    price: 1e5,
    cargoBays: 20,
    ...slotsFor("large", "military"),
    // W4 S3 G2
    ...crewFor("large"),
    fuelTanks: 16,
    hullStrength: 150,
    fuelCostPerParsec: 15,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  cicada: {
    // Deep-space pathfinder: five gadget bays and tanks built for the frontier.
    id: "cicada",
    size: "large",
    shipClass: "explorer",
    price: 14e4,
    cargoBays: 25,
    ...slotsFor("large", "explorer"),
    // W2 S2 G5
    ...crewFor("large"),
    fuelTanks: 22,
    hullStrength: 130,
    fuelCostPerParsec: 9,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  grasshopper: {
    id: "grasshopper",
    size: "large",
    shipClass: "civilian",
    price: 15e4,
    cargoBays: 30,
    ...slotsFor("large", "civilian"),
    // W2 S3 G3
    ...crewFor("large"),
    fuelTanks: 15,
    hullStrength: 150,
    fuelCostPerParsec: 15,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  centipede: {
    // Heavy freighter: enormous hold and quarters, but sluggish and lightly armed.
    id: "centipede",
    size: "large",
    shipClass: "trade",
    price: 18e4,
    cargoBays: 75,
    ...slotsFor("large", "trade"),
    // W2 S2 G4
    ...crewFor("large"),
    fuelTanks: 14,
    hullStrength: 160,
    fuelCostPerParsec: 18,
    repairCostPerUnit: 3,
    minTechLevel: 6
  },
  termite: {
    // Armoured industrial hauler: the heaviest shields protect the big hold.
    id: "termite",
    size: "large",
    shipClass: "industrial",
    price: 225e3,
    cargoBays: 60,
    ...slotsFor("large", "industrial"),
    // W2 S4 G3
    ...crewFor("large"),
    fuelTanks: 13,
    hullStrength: 200,
    fuelCostPerParsec: 20,
    repairCostPerUnit: 4,
    minTechLevel: 7
  },
  scorpion: {
    // Pure warship: five hardpoints and heavy shields on a durable hull.
    id: "scorpion",
    size: "capital",
    shipClass: "military",
    price: 26e4,
    cargoBays: 25,
    ...slotsFor("capital", "military"),
    // W5 S4 G2
    ...crewFor("capital"),
    fuelTanks: 15,
    hullStrength: 220,
    fuelCostPerParsec: 20,
    repairCostPerUnit: 4,
    minTechLevel: 7
  },
  wasp: {
    id: "wasp",
    size: "capital",
    shipClass: "civilian",
    price: 3e5,
    cargoBays: 35,
    ...slotsFor("capital", "civilian"),
    // W3 S4 G4
    ...crewFor("capital"),
    fuelTanks: 14,
    hullStrength: 200,
    fuelCostPerParsec: 20,
    repairCostPerUnit: 4,
    minTechLevel: 7
  },
  goliath: {
    // Colossal mining platform: five shield emitters guard a vast ore hold.
    id: "goliath",
    size: "capital",
    shipClass: "industrial",
    price: 32e4,
    cargoBays: 90,
    ...slotsFor("capital", "industrial"),
    // W2 S5 G4
    ...crewFor("capital"),
    fuelTanks: 12,
    hullStrength: 260,
    fuelCostPerParsec: 22,
    repairCostPerUnit: 5,
    minTechLevel: 7
  },
  atlas: {
    // Super-freighter: the largest hold in space, escorted or not at your peril.
    id: "atlas",
    size: "capital",
    shipClass: "trade",
    price: 35e4,
    cargoBays: 100,
    ...slotsFor("capital", "trade"),
    // W2 S3 G5
    ...crewFor("capital"),
    fuelTanks: 13,
    hullStrength: 220,
    fuelCostPerParsec: 24,
    repairCostPerUnit: 5,
    minTechLevel: 7
  },
  monarch: {
    // Flagship expedition vessel: six gadget bays and the deepest tanks built.
    id: "monarch",
    size: "capital",
    shipClass: "explorer",
    price: 36e4,
    cargoBays: 30,
    ...slotsFor("capital", "explorer"),
    // W2 S3 G6
    ...crewFor("capital"),
    fuelTanks: 24,
    hullStrength: 210,
    fuelCostPerParsec: 16,
    repairCostPerUnit: 5,
    minTechLevel: 7
  },
  widow: {
    // Elite flagship: heavy shields, four gadget slots and strong firepower.
    id: "widow",
    size: "capital",
    shipClass: "civilian",
    price: 38e4,
    cargoBays: 30,
    ...slotsFor("capital", "civilian"),
    // W3 S4 G4
    ...crewFor("capital"),
    fuelTanks: 18,
    hullStrength: 240,
    fuelCostPerParsec: 18,
    repairCostPerUnit: 5,
    minTechLevel: 7
  }
};
var SHIP_TYPE_IDS = Object.keys(SHIP_TYPES);
function sizeRank(id) {
  return SIZE_RANK[SHIP_TYPES[id].size];
}

// src/game/data/equipment.ts
var WEAPONS = {
  pulse: { id: "pulse", power: 15, price: 2e3, minTechLevel: 5 },
  beam: { id: "beam", power: 25, price: 12500, minTechLevel: 6 },
  plasma: { id: "plasma", power: 30, price: 22e3, minTechLevel: 6 },
  military: { id: "military", power: 35, price: 35e3, minTechLevel: 7 },
  fusion: { id: "fusion", power: 50, price: 7e4, minTechLevel: 7 },
  railgun: { id: "railgun", power: 95, price: 18e4, minTechLevel: 7, stationOnly: true },
  singularity: { id: "singularity", power: 160, price: 42e4, minTechLevel: 7, stationOnly: true }
};
var SHIELDS = {
  energy: { id: "energy", power: 100, price: 5e3, minTechLevel: 5 },
  reflective: { id: "reflective", power: 200, price: 2e4, minTechLevel: 6 },
  deflector: { id: "deflector", power: 350, price: 45e3, minTechLevel: 7 },
  barrier: { id: "barrier", power: 900, price: 21e4, minTechLevel: 7, stationOnly: true }
};
var EXTRA_CARGO_BAYS = 5;
var EXTRA_CARGO_BAYS_ADVANCED = 20;
var EXTRA_FUEL_TANKS = 3;
var EXTRA_FUEL_TANKS_ADVANCED = 12;
var GADGETS = {
  cargoBays: { id: "cargoBays", price: 2500, minTechLevel: 4 },
  autoRepair: { id: "autoRepair", price: 7500, minTechLevel: 5 },
  navigation: { id: "navigation", price: 15e3, minTechLevel: 5 },
  targeting: { id: "targeting", price: 25e3, minTechLevel: 6 },
  fuelCompactor: { id: "fuelCompactor", price: 3e4, minTechLevel: 6 },
  hiddenCompartment: { id: "hiddenCompartment", price: 45e3, minTechLevel: 6 },
  cloaking: { id: "cloaking", price: 1e5, minTechLevel: 7 },
  nanoHold: { id: "nanoHold", price: 95e3, minTechLevel: 7, stationOnly: true },
  quantumCompactor: { id: "quantumCompactor", price: 14e4, minTechLevel: 7, stationOnly: true },
  aiHelm: { id: "aiHelm", price: 12e4, minTechLevel: 7, stationOnly: true },
  battleComputer: { id: "battleComputer", price: 16e4, minTechLevel: 7, stationOnly: true },
  nanoForge: { id: "nanoForge", price: 13e4, minTechLevel: 7, stationOnly: true }
};
var GADGET_SKILL_BONUS = 3;
var GADGET_SKILL_BONUS_ADVANCED = 8;
var WEAPON_IDS = Object.keys(WEAPONS);
var SHIELD_IDS = Object.keys(SHIELDS);
var GADGET_IDS = Object.keys(GADGETS);
var PLANET_WEAPON_IDS = WEAPON_IDS.filter((id) => !WEAPONS[id].stationOnly);
var PLANET_SHIELD_IDS = SHIELD_IDS.filter((id) => !SHIELDS[id].stationOnly);
var PLANET_GADGET_IDS = GADGET_IDS.filter((id) => !GADGETS[id].stationOnly);

// src/game/data/robots.ts
var ROBOTS = {
  helm: {
    // Flight-control android: flies the ship, little else.
    id: "helm",
    profession: "pilot",
    skills: { pilot: 10, fighter: 3, trader: 1, engineer: 3, electrician: 3 },
    price: 78e3,
    minTechLevel: 6
  },
  gunner: {
    // Fire-control android: fast, precise, and utterly single-minded.
    id: "gunner",
    profession: "gunner",
    skills: { pilot: 3, fighter: 10, trader: 1, engineer: 3, electrician: 3 },
    price: 84e3,
    minTechLevel: 6
  },
  wrench: {
    // Maintenance android: patches hull plate faster than any human crew.
    id: "wrench",
    profession: "mechanic",
    skills: { pilot: 2, fighter: 2, trader: 1, engineer: 10, electrician: 6 },
    price: 72e3,
    minTechLevel: 6
  },
  spark: {
    // Power-systems android: keeps the wiring from ever catching fire.
    id: "spark",
    profession: "electrician",
    skills: { pilot: 2, fighter: 2, trader: 1, engineer: 6, electrician: 10 },
    price: 72e3,
    minTechLevel: 6
  },
  utility: {
    // General-purpose unit: covers any station passably, none of them well.
    id: "utility",
    profession: "generalist",
    skills: { pilot: 5, fighter: 5, trader: 1, engineer: 5, electrician: 5 },
    price: 55e3,
    minTechLevel: 7
  }
};
var ROBOT_IDS = Object.keys(ROBOTS);

// src/game/data/stations.ts
var PLANET_MAX_HULL_UPGRADES = 5;
var STATIONS = {
  // Weapons research: the guns nobody wants built over an inhabited world.
  military: {
    weapons: ["railgun", "singularity"],
    shields: ["barrier"],
    gadgets: ["battleComputer"],
    maxHullUpgrades: 8,
    repairCostMul: 0.85
  },
  // Deep-space research: sensors, navigation and the exotic end of physics.
  science: {
    weapons: [],
    shields: ["barrier"],
    gadgets: ["aiHelm", "quantumCompactor"],
    maxHullUpgrades: PLANET_MAX_HULL_UPGRADES,
    repairCostMul: 1
  },
  // Heavy fabrication: holds, drives, hull plate and the rigs that fit them.
  engineering: {
    weapons: ["railgun"],
    shields: [],
    gadgets: ["nanoHold", "nanoForge", "quantumCompactor"],
    maxHullUpgrades: 10,
    repairCostMul: 0.5
  }
};
var STATION_IDS = Object.keys(STATIONS);

// src/game/engine/location.ts
function capitalOnly() {
  return [{ id: 0, kind: "planet", orbit: 1, angle: 0, mineSite: null }];
}
function systemBodies(sys) {
  if (!sys) return [];
  return sys.bodies && sys.bodies.length > 0 ? sys.bodies : capitalOnly();
}
function bodyMineSite(sys, body) {
  if (!sys || !body) return null;
  return body.kind === "planet" ? sys.mineSite : body.mineSite;
}
function currentBodyIndex(state) {
  const bodies = systemBodies(state.systems[state.currentSystem]);
  const idx = state.currentBody ?? 0;
  return idx >= 0 && idx < bodies.length ? idx : 0;
}
function currentBody(state) {
  return systemBodies(state.systems[state.currentSystem])[currentBodyIndex(state)];
}
function atCapital(state) {
  return currentBodyIndex(state) === 0;
}
function currentStation(state) {
  const body = currentBody(state);
  return body?.kind === "station" ? body.station ?? "science" : null;
}
function hasSpaceport(state) {
  return atCapital(state);
}
function hasShipyard(state) {
  return atCapital(state) || currentStation(state) !== null;
}
function currentMineSite(state) {
  const sys = state.systems[state.currentSystem];
  return bodyMineSite(sys, currentBody(state));
}
function maxHullUpgradesHere(state) {
  const station = currentStation(state);
  return station ? STATIONS[station].maxHullUpgrades : PLANET_MAX_HULL_UPGRADES;
}
function repairCostMulHere(state) {
  const station = currentStation(state);
  return station ? STATIONS[station].repairCostMul : 1;
}
function bodyTransitDays(from, to) {
  const gap = Math.abs(from.orbit - to.orbit);
  return Math.max(1, Math.min(6, Math.round(gap * 0.8)));
}
function transitDaysTo(state, bodyId) {
  const bodies = systemBodies(state.systems[state.currentSystem]);
  const from = bodies[currentBodyIndex(state)];
  const to = bodies[bodyId];
  if (!from || !to) return 0;
  return bodyTransitDays(from, to);
}

// src/game/engine/sourcing.ts
function emptyGoods() {
  const rec = {};
  for (const g of GOOD_IDS) rec[g] = 0;
  return rec;
}
function noteLocalSourcing(state, good, qty) {
  if (qty <= 0) return;
  if (!state.sourcedHere) state.sourcedHere = emptyGoods();
  state.sourcedHere[good] += qty;
}
function clearLocalSourcing(state) {
  state.sourcedHere = emptyGoods();
}
function releaseLocalSourcing(state, good, qty) {
  if (qty <= 0 || !state.sourcedHere) return;
  state.sourcedHere[good] = Math.max(0, state.sourcedHere[good] - qty);
}
function deliverableUnits(state, good) {
  return Math.max(0, state.ship.cargo[good] - (state.sourcedHere?.[good] ?? 0));
}
function questSupply(quest) {
  if ((quest.type === "relief" || quest.type === "smuggle" || quest.type === "fetch") && quest.good && quest.amount) {
    return { good: quest.good, amount: quest.amount };
  }
  return null;
}
function isContractEmbargoed(state, good) {
  return state.quests.some((q) => {
    if (q.status !== "active" || q.targetSystem !== state.currentSystem) return false;
    return questSupply(q)?.good === good;
  });
}

// src/game/engine/crew.ts
var ROLE_SKILL = {
  pilot: "pilot",
  gunner: "fighter",
  mechanic: "engineer",
  electrician: "electrician"
};
var ROLE_GADGET = {
  pilot: "navigation",
  gunner: "targeting",
  mechanic: "autoRepair"
};
var ROLE_GADGET_ADVANCED = {
  pilot: "aiHelm",
  gunner: "battleComputer",
  mechanic: "nanoForge"
};
var DOUBLE_DUTY_PENALTY = 0.5;
var ROBOT_FUEL_PER_DAY = 0.34;
var INCIDENT_BASE_RISK = 6e-3;
var INCIDENT_OVERLOAD_RISK = 0.02;
function robotsPowered(state) {
  return state.ship.fuel > 0;
}
function shipRobots(state) {
  return state.ship.robots ?? [];
}
function crewHands(state) {
  const hands = [
    { id: "commander", kind: "commander", skills: state.skills }
  ];
  for (const id of state.ship.crew) {
    const m = MERCENARIES[id];
    if (m) hands.push({ id, kind: "mercenary", skills: m.skills });
  }
  if (robotsPowered(state)) {
    for (const id of shipRobots(state)) {
      const r = ROBOTS[id];
      if (r) hands.push({ id, kind: "robot", skills: r.skills });
    }
  }
  return hands;
}
function crewCount(state) {
  return crewHands(state).length;
}
function berthsUsed(state) {
  return 1 + state.ship.crew.length + shipRobots(state).length;
}
function minCrew(state) {
  return SHIP_TYPES[state.ship.type].minCrew;
}
function recommendedCrew(state) {
  return SHIP_TYPES[state.ship.type].crewQuarters;
}
function crewShortfall(state) {
  return Math.max(0, minCrew(state) - crewCount(state));
}
function crewLoad(state) {
  return minCrew(state) / Math.max(1, crewCount(state));
}
function skillAt(state, hand, role) {
  const base = hand.skills[ROLE_SKILL[role]];
  const advanced = ROLE_GADGET_ADVANCED[role];
  if (advanced && state.ship.gadgets.includes(advanced)) {
    return base + GADGET_SKILL_BONUS_ADVANCED;
  }
  const gadget = ROLE_GADGET[role];
  return base + (gadget && state.ship.gadgets.includes(gadget) ? GADGET_SKILL_BONUS : 0);
}
function assignRoles(state) {
  const hands = crewHands(state);
  const taken = /* @__PURE__ */ new Set();
  const result = {};
  const unfilled = new Set(CREW_ROLES);
  while (unfilled.size > 0 && taken.size < hands.length) {
    let bestRole = null;
    let bestHand = null;
    let best = -1;
    for (const role of unfilled) {
      for (const hand of hands) {
        if (taken.has(hand)) continue;
        const skill = skillAt(state, hand, role);
        if (skill > best) {
          best = skill;
          bestRole = role;
          bestHand = hand;
        }
      }
    }
    if (!bestRole || !bestHand) break;
    result[bestRole] = { role: bestRole, hand: bestHand, strength: best, covered: false };
    taken.add(bestHand);
    unfilled.delete(bestRole);
  }
  const staffing = Math.min(1, crewCount(state) / minCrew(state));
  const factor = DOUBLE_DUTY_PENALTY + (1 - DOUBLE_DUTY_PENALTY) * staffing;
  for (const role of unfilled) {
    let bestHand = null;
    let best = 0;
    for (const hand of hands) {
      const skill = skillAt(state, hand, role);
      if (skill > best) {
        best = skill;
        bestHand = hand;
      }
    }
    result[role] = {
      role,
      hand: bestHand,
      strength: Math.round(best * factor),
      covered: true
    };
  }
  return result;
}
function battleStations(state) {
  const hands = crewCount(state);
  const guns = Math.max(1, state.ship.weapons.length);
  const helm = hands > 1;
  const gunners = helm ? hands - 1 : 1;
  const shots = Math.max(1, Math.min(gunners, guns));
  return { shots, helm, actions: shots + (helm ? 1 : 0) };
}
function generateCrewRoster(state, rng) {
  const aboard = new Set(state.ship.crew);
  const pool = MERCENARY_IDS.filter((id) => !aboard.has(id));
  const size = Math.min(pool.length, rng.int(1, 2 + Math.round(currentTech(state) / 3)));
  const picked = [];
  const taken = /* @__PURE__ */ new Set();
  while (picked.length < size) {
    const i = rng.int(0, pool.length - 1);
    if (taken.has(i)) continue;
    taken.add(i);
    picked.push(pool[i]);
  }
  return picked;
}
function currentTech(state) {
  return state.systems[state.currentSystem]?.techLevel ?? 4;
}
function crewRoster(state) {
  const sys = state.systems[state.currentSystem];
  return (sys?.mercenaryIds ?? []).filter((id) => MERCENARIES[id] && !state.ship.crew.includes(id));
}
function roleStrength(state, role) {
  return assignRoles(state)[role].strength;
}
function roleRisk(state, role) {
  const strength = roleStrength(state, role);
  const overload = Math.max(0, crewLoad(state) - 1);
  const competence = Math.min(1, strength / 10);
  const risk = (INCIDENT_BASE_RISK + INCIDENT_OVERLOAD_RISK * overload) * (1 - competence);
  return Math.max(0, Math.min(0.5, risk));
}
function crewRepairPerDay(state) {
  return Math.floor(roleStrength(state, "mechanic") / 4);
}
function bulkiestCargo(state) {
  let best = null;
  let bestQty = 0;
  for (const g of GOOD_IDS) {
    if (state.ship.cargo[g] > bestQty) {
      bestQty = state.ship.cargo[g];
      best = g;
    }
  }
  return best;
}
function runIncident(state, role, rng) {
  const maxHullPoints = SHIP_TYPES[state.ship.type].hullStrength;
  if (role === "electrician") {
    const dmg2 = Math.min(state.ship.hull - 1, rng.int(3, Math.max(4, Math.round(maxHullPoints * 0.12))));
    if (dmg2 > 0) state.ship.hull -= dmg2;
    const good = bulkiestCargo(state);
    let burned = 0;
    if (good) {
      burned = Math.min(state.ship.cargo[good], rng.int(1, 4));
      state.ship.cargo[good] -= burned;
      releaseLocalSourcing(state, good, burned);
      if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0;
    }
    state.day++;
    return {
      role,
      titleKey: "crew.incident.fire.title",
      bodyKey: burned > 0 ? "crew.incident.fire.body" : "crew.incident.fire.bodyNoCargo",
      params: { dmg: Math.max(0, dmg2), qty: burned, good: good ?? "" }
    };
  }
  if (role === "mechanic") {
    const dmg2 = Math.min(state.ship.hull - 1, rng.int(2, Math.max(3, Math.round(maxHullPoints * 0.1))));
    if (dmg2 > 0) state.ship.hull -= dmg2;
    return {
      role,
      titleKey: "crew.incident.breakdown.title",
      bodyKey: "crew.incident.breakdown.body",
      params: { dmg: Math.max(0, dmg2) }
    };
  }
  if (role === "pilot") {
    const lost = Math.min(state.ship.fuel, rng.int(1, 3));
    state.ship.fuel -= lost;
    return {
      role,
      titleKey: "crew.incident.misjump.title",
      bodyKey: "crew.incident.misjump.body",
      params: { lost }
    };
  }
  const dmg = Math.min(state.ship.hull - 1, rng.int(2, Math.max(3, Math.round(maxHullPoints * 0.08))));
  if (dmg > 0) state.ship.hull -= dmg;
  state.ship.shieldPoints = state.ship.shieldPoints.map(() => 0);
  return {
    role: "gunner",
    titleKey: "crew.incident.misfire.title",
    bodyKey: "crew.incident.misfire.body",
    params: { dmg: Math.max(0, dmg) }
  };
}
function rollCrewIncident(state, rng) {
  if (state.ship.hull <= 1) return null;
  for (const role of CREW_ROLES) {
    if (rng.chance(roleRisk(state, role))) return runIncident(state, role, rng);
  }
  return null;
}

// src/game/engine/game.ts
var GAME_VERSION = 1;
var STARTING_CREDITS = 1e3;
var MAX_SKILL = 10;
var HULL_UPGRADE_AMOUNT = 25;
var MAX_HULL_UPGRADES = PLANET_MAX_HULL_UPGRADES;
var ESCAPE_POD_PRICE = 2e3;
var EXPLORER_RANGE_BONUS = 3;
var MILITARY_WEAPON_BONUS = 1.15;
var INDUSTRIAL_MINING_YIELD = 2;
function totalCargoBays(ship) {
  const base = SHIP_TYPES[ship.type].cargoBays;
  const extra = ship.gadgets.filter((g) => g === "cargoBays").length * EXTRA_CARGO_BAYS;
  const advanced = ship.gadgets.filter((g) => g === "nanoHold").length * EXTRA_CARGO_BAYS_ADVANCED;
  return base + extra + advanced;
}
function gadgetBays(id) {
  if (id === "cargoBays") return EXTRA_CARGO_BAYS;
  if (id === "nanoHold") return EXTRA_CARGO_BAYS_ADVANCED;
  return 0;
}
function usedCargoBays(ship) {
  return GOOD_IDS.reduce((sum, g) => sum + ship.cargo[g], 0);
}
function freeCargoBays(ship) {
  return totalCargoBays(ship) - usedCargoBays(ship);
}
var ESCORT_MIN_WEAPONS = 2;
var ESCORT_MIN_SHIELDS = 1;
function escortShipProblem(state) {
  if (SHIP_TYPES[state.ship.type].shipClass !== "military") return "error.escortNeedsMilitary";
  if (state.ship.weapons.length < ESCORT_MIN_WEAPONS) return "error.escortNeedsWeapons";
  if (state.ship.shields.length < ESCORT_MIN_SHIELDS) return "error.escortNeedsShield";
  return null;
}
function canEscort(state) {
  return escortShipProblem(state) === null;
}
function shipValue(ship) {
  const type = SHIP_TYPES[ship.type];
  let value = Math.round(type.price * 0.75);
  for (const w of ship.weapons) value += Math.round(WEAPONS[w].price * 0.75);
  for (const s of ship.shields) value += Math.round(SHIELDS[s].price * 0.75);
  for (const g of ship.gadgets) value += Math.round(GADGETS[g].price * 0.75);
  value += (ship.hullUpgrades ?? 0) * 1e3;
  return value;
}
function effectiveSkills(state) {
  const posts = assignRoles(state);
  let trader = state.skills.trader;
  for (const hand of crewHands(state)) trader = Math.max(trader, hand.skills.trader);
  return {
    pilot: posts.pilot.strength,
    fighter: posts.gunner.strength,
    engineer: posts.mechanic.strength,
    electrician: posts.electrician.strength,
    trader
  };
}
function maxFuel(ship) {
  const type = SHIP_TYPES[ship.type];
  const extra = ship.gadgets.filter((g) => g === "fuelCompactor").length * EXTRA_FUEL_TANKS;
  const advanced = ship.gadgets.filter((g) => g === "quantumCompactor").length * EXTRA_FUEL_TANKS_ADVANCED;
  const classBonus = type.shipClass === "explorer" ? EXPLORER_RANGE_BONUS : 0;
  return type.fuelTanks + extra + advanced + classBonus;
}
function fuelPricePerParsec(state) {
  const base = SHIP_TYPES[state.ship.type].fuelCostPerParsec;
  const mul = economyOf(currentSystem(state).economyType).fuelCostMul;
  return Math.max(1, Math.round(base * mul));
}
function crewWages(state) {
  return state.ship.crew.reduce((sum, id) => sum + (MERCENARIES[id]?.wage ?? 0), 0);
}
function freeQuarters(ship) {
  return SHIP_TYPES[ship.type].crewQuarters - 1 - ship.crew.length - (ship.robots?.length ?? 0);
}
function maxHull(ship) {
  return SHIP_TYPES[ship.type].hullStrength + (ship.hullUpgrades ?? 0) * HULL_UPGRADE_AMOUNT;
}
function hullUpgradePrice(ship) {
  return 2500 * ((ship.hullUpgrades ?? 0) + 1);
}
function totalShieldPower(ship) {
  return ship.shields.reduce((sum, s) => sum + SHIELDS[s].power, 0);
}
function currentShieldCharge(ship) {
  return ship.shieldPoints.reduce((sum, p) => sum + p, 0);
}
function weaponPower(ship) {
  const raw = ship.weapons.reduce((sum, w) => sum + WEAPONS[w].power, 0);
  const mul = SHIP_TYPES[ship.type].shipClass === "military" ? MILITARY_WEAPON_BONUS : 1;
  return Math.round(raw * mul);
}
function newGame(opts) {
  const seed = opts.seed ?? randomSeed();
  const rng = new Rng(seed);
  const systems = generateGalaxy(seed);
  for (const sys of systems) refreshMarket(sys, rng);
  const startRange = SHIP_TYPES.flea.fuelTanks;
  const hasNeighbour = (s) => systems.some((o) => o.id !== s.id && distance(s, o) <= startRange);
  const startId = systems.find((s) => s.techLevel >= 4 && s.techLevel <= 6 && hasNeighbour(s))?.id ?? systems.find((s) => hasNeighbour(s))?.id ?? systems.find((s) => s.techLevel >= 4 && s.techLevel <= 6)?.id ?? 0;
  const ship = {
    type: "flea",
    hull: SHIP_TYPES.flea.hullStrength,
    hullUpgrades: 0,
    fuel: SHIP_TYPES.flea.fuelTanks,
    cargo: emptyGoods(),
    weapons: ["pulse"],
    shields: [],
    shieldPoints: [],
    gadgets: [],
    crew: [],
    robots: [],
    escapePod: false
  };
  const skills = opts.skills ?? {
    pilot: 5,
    fighter: 5,
    trader: 5,
    engineer: 5,
    electrician: 5
  };
  const state = {
    seed,
    day: 1,
    credits: STARTING_CREDITS,
    debt: 0,
    commanderName: opts.commanderName || "Jameson",
    skills,
    ship,
    record: { policeRecord: 0, reputation: 0 },
    currentSystem: startId,
    // Every journey starts on the capital planet's landing field.
    currentBody: 0,
    systems,
    insurance: false,
    noClaim: 0,
    autoRefuel: false,
    buyingPrice: emptyGoods(),
    sourcedHere: emptyGoods(),
    log: [],
    flags: {},
    quests: [],
    version: GAME_VERSION
  };
  systems[startId].visited = true;
  pushLog(state, "log.gameStart", { system: systems[startId].nameId });
  return state;
}
function currentSystem(state) {
  return state.systems[state.currentSystem];
}
function pushLog(state, key, params) {
  state.log.unshift({ day: state.day, key, params });
  if (state.log.length > 100) state.log.pop();
}
function traderDiscount(state) {
  return Math.min(0.1, effectiveSkills(state).trader * 0.01);
}
function marketBuyPrice(state, good) {
  const listed = currentSystem(state).buyPrice[good];
  if (listed <= 0) return 0;
  if (isContractEmbargoed(state, good)) return 0;
  return Math.max(1, Math.round(listed * (1 - traderDiscount(state))));
}
function buyGood(state, good, amount) {
  if (!atCapital(state)) return fail("error.noMarketHere");
  const sys = currentSystem(state);
  const price = sys.buyPrice[good];
  if (price <= 0 || sys.qty[good] <= 0) return fail("error.notSold");
  if (isContractEmbargoed(state, good)) return fail("error.contractEmbargo");
  const unit = marketBuyPrice(state, good);
  const maxByCredits = Math.floor(state.credits / unit);
  const maxByCargo = freeCargoBays(state.ship);
  const maxByStock = sys.qty[good];
  const qty = Math.min(amount, maxByCredits, maxByCargo, maxByStock);
  if (qty <= 0) return fail("error.cannotBuy");
  const cost = qty * unit;
  const prevQty = state.ship.cargo[good];
  const prevCost = state.buyingPrice[good] * prevQty;
  state.ship.cargo[good] += qty;
  state.buyingPrice[good] = state.ship.cargo[good] > 0 ? Math.round((prevCost + cost) / state.ship.cargo[good]) : 0;
  state.credits -= cost;
  sys.qty[good] -= qty;
  noteLocalSourcing(state, good, qty);
  return okInfo("info.bought", { qty, good, cost });
}
function sellGood(state, good, amount) {
  if (amount <= 0) return fail("error.nothingToSell");
  if (!atCapital(state)) return fail("error.noMarketHere");
  const sys = currentSystem(state);
  const have = state.ship.cargo[good];
  if (have <= 0) return fail("error.nothingToSell");
  if (sys.sellPrice[good] <= 0) return fail("error.notWanted");
  const qty = Math.min(amount, have);
  const unit = sys.sellPrice[good];
  const revenue = qty * unit;
  state.ship.cargo[good] -= qty;
  state.credits += revenue;
  releaseLocalSourcing(state, good, qty);
  if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0;
  return okInfo("info.sold", { qty, good, revenue });
}
function dumpGood(state, good, amount) {
  if (amount <= 0) return fail("error.nothingToDump");
  const have = state.ship.cargo[good];
  if (have <= 0) return fail("error.nothingToDump");
  const qty = Math.min(amount, have);
  state.ship.cargo[good] -= qty;
  releaseLocalSourcing(state, good, qty);
  if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0;
  return okInfo("info.dumped", { qty, good });
}
function refuel(state, parsecs) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  const unit = fuelPricePerParsec(state);
  const needed = Math.min(parsecs, maxFuel(state.ship) - state.ship.fuel);
  if (needed <= 0) return fail("error.tankFull");
  const affordable = Math.floor(state.credits / unit);
  const buy = Math.min(needed, affordable);
  if (buy <= 0) return fail("error.noCreditsFuel");
  state.ship.fuel += buy;
  state.credits -= buy * unit;
  return okInfo("info.refuelled", { parsecs: buy, cost: buy * unit });
}
function refuelFull(state) {
  return refuel(state, maxFuel(state.ship));
}
function repairPricePerUnit(state) {
  const base = SHIP_TYPES[state.ship.type].repairCostPerUnit;
  return Math.max(1, Math.round(base * repairCostMulHere(state)));
}
function repair(state, units) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  const unit = repairPricePerUnit(state);
  const needed = Math.min(units, maxHull(state.ship) - state.ship.hull);
  if (needed <= 0) return fail("error.hullFull");
  const affordable = Math.floor(state.credits / unit);
  const fix = Math.min(needed, affordable);
  if (fix <= 0) return fail("error.noCreditsRepair");
  state.ship.hull += fix;
  state.credits -= fix * unit;
  return okInfo("info.repaired", { units: fix, cost: fix * unit });
}
function repairFull(state) {
  return repair(state, maxHull(state.ship));
}
function buyHullUpgrade(state) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  const ship = state.ship;
  const current = ship.hullUpgrades ?? 0;
  if (current >= maxHullUpgradesHere(state)) return fail("error.maxHullUpgrades");
  const price = hullUpgradePrice(ship);
  if (state.credits < price) return fail("error.notEnoughCredits");
  state.credits -= price;
  ship.hullUpgrades = current + 1;
  ship.hull += HULL_UPGRADE_AMOUNT;
  return okInfo("info.hullUpgraded", { amount: HULL_UPGRADE_AMOUNT, cost: price });
}
function weaponsForSale(state) {
  const station = currentStation(state);
  if (station) return STATIONS[station].weapons;
  if (!atCapital(state)) return [];
  const tech = currentSystem(state).techLevel;
  return WEAPON_IDS.filter((id) => !WEAPONS[id].stationOnly && WEAPONS[id].minTechLevel <= tech);
}
function shieldsForSale(state) {
  const station = currentStation(state);
  if (station) return STATIONS[station].shields;
  if (!atCapital(state)) return [];
  const tech = currentSystem(state).techLevel;
  return SHIELD_IDS.filter((id) => !SHIELDS[id].stationOnly && SHIELDS[id].minTechLevel <= tech);
}
function gadgetsForSale(state) {
  const station = currentStation(state);
  if (station) return STATIONS[station].gadgets;
  if (!atCapital(state)) return [];
  const tech = currentSystem(state).techLevel;
  return GADGET_IDS.filter((id) => !GADGETS[id].stationOnly && GADGETS[id].minTechLevel <= tech);
}
function traderPrice(state, base) {
  return Math.round(base * (1 - traderDiscount(state)));
}
function buyWeapon(state, id) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  if (!weaponsForSale(state).includes(id)) return fail("error.notStockedHere");
  const type = SHIP_TYPES[state.ship.type];
  if (state.ship.weapons.length >= type.weaponSlots) return fail("error.noWeaponSlot");
  const price = traderPrice(state, WEAPONS[id].price);
  if (state.credits < price) return fail("error.notEnoughCredits");
  state.credits -= price;
  state.ship.weapons.push(id);
  return okInfo("info.equipmentBought");
}
function buyShield(state, id) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  if (!shieldsForSale(state).includes(id)) return fail("error.notStockedHere");
  const type = SHIP_TYPES[state.ship.type];
  if (state.ship.shields.length >= type.shieldSlots) return fail("error.noShieldSlot");
  const price = traderPrice(state, SHIELDS[id].price);
  if (state.credits < price) return fail("error.notEnoughCredits");
  state.credits -= price;
  state.ship.shields.push(id);
  state.ship.shieldPoints.push(SHIELDS[id].power);
  return okInfo("info.equipmentBought");
}
function buyGadget(state, id) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  if (!gadgetsForSale(state).includes(id)) return fail("error.notStockedHere");
  const type = SHIP_TYPES[state.ship.type];
  if (state.ship.gadgets.length >= type.gadgetSlots) return fail("error.noGadgetSlot");
  if (gadgetBays(id) === 0 && state.ship.gadgets.includes(id)) return fail("error.alreadyOwned");
  const price = traderPrice(state, GADGETS[id].price);
  if (state.credits < price) return fail("error.notEnoughCredits");
  state.credits -= price;
  state.ship.gadgets.push(id);
  return okInfo("info.equipmentBought");
}
function buyEscapePod(state) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  if (state.ship.escapePod) return fail("error.alreadyOwned");
  if (state.credits < ESCAPE_POD_PRICE) return fail("error.notEnoughCredits");
  state.credits -= ESCAPE_POD_PRICE;
  state.ship.escapePod = true;
  return okInfo("info.escapePodBought");
}
function shipsForSale(state) {
  if (!atCapital(state)) return [];
  const tech = currentSystem(state).techLevel;
  return SHIP_TYPE_IDS.filter((id) => SHIP_TYPES[id].minTechLevel <= tech);
}
function buyShip(state, target) {
  if (!atCapital(state)) return fail("error.noShipyardHere");
  if (!SHIP_TYPES[target] || !shipsForSale(state).includes(target)) return fail("error.notSold");
  if (target === state.ship.type) return fail("error.sameShip");
  if (usedCargoBays(state.ship) > 0) return fail("error.cargoNotEmpty");
  const price = traderPrice(state, SHIP_TYPES[target].price);
  const tradeIn = shipValue(state.ship);
  const net = price - tradeIn;
  if (state.credits < net) return fail("error.notEnoughCredits");
  const keepPod = state.ship.escapePod;
  const berths = SHIP_TYPES[target].crewQuarters - 1;
  const crew = state.ship.crew.slice(0, berths);
  const robots = (state.ship.robots ?? []).slice(0, Math.max(0, berths - crew.length));
  const leftBehind = state.ship.crew.length - crew.length + (state.ship.robots?.length ?? 0) - robots.length;
  state.credits -= net;
  state.ship = {
    type: target,
    hull: SHIP_TYPES[target].hullStrength,
    hullUpgrades: 0,
    fuel: SHIP_TYPES[target].fuelTanks,
    cargo: emptyGoods(),
    weapons: [],
    shields: [],
    shieldPoints: [],
    gadgets: [],
    crew,
    robots,
    escapePod: keepPod
  };
  if (leftBehind > 0) pushLog(state, "log.crewLeftBehind", { count: leftBehind });
  return okInfo("info.shipBought", { ship: target });
}
function sellWeapon(state, index) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  const id = state.ship.weapons[index];
  if (!id) return fail("error.nothingToRemove");
  state.ship.weapons.splice(index, 1);
  state.credits += Math.round(WEAPONS[id].price * 0.75);
  return okInfo("info.equipmentSold");
}
function sellShield(state, index) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  const id = state.ship.shields[index];
  if (!id) return fail("error.nothingToRemove");
  state.ship.shields.splice(index, 1);
  state.ship.shieldPoints.splice(index, 1);
  state.credits += Math.round(SHIELDS[id].price * 0.75);
  return okInfo("info.equipmentSold");
}
function sellGadget(state, index) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  const id = state.ship.gadgets[index];
  if (!id) return fail("error.nothingToRemove");
  const bays = gadgetBays(id);
  if (bays > 0 && usedCargoBays(state.ship) > totalCargoBays(state.ship) - bays) {
    return fail("error.cargoNotEmpty");
  }
  state.ship.gadgets.splice(index, 1);
  state.credits += Math.round(GADGETS[id].price * 0.75);
  return okInfo("info.equipmentSold");
}
function hireMercenary(state, id) {
  if (!atCapital(state)) return fail("error.noHiringHallHere");
  const sys = currentSystem(state);
  const roster = sys.mercenaryIds ?? [];
  if (!roster.includes(id) || !MERCENARIES[id]) return fail("error.mercNotHere");
  if (freeQuarters(state.ship) <= 0) return fail("error.noQuarters");
  if (state.ship.crew.includes(id)) return fail("error.alreadyHired");
  state.ship.crew.push(id);
  sys.mercenaryIds = roster.filter((m) => m !== id);
  return okInfo("info.mercHired", { name: id });
}
function fireMercenary(state, id) {
  if (!atCapital(state)) return fail("error.noHiringHallHere");
  const idx = state.ship.crew.indexOf(id);
  if (idx < 0) return fail("error.notInCrew");
  state.ship.crew.splice(idx, 1);
  const sys = currentSystem(state);
  sys.mercenaryIds = [...sys.mercenaryIds ?? [], id];
  return okInfo("info.mercFired", { name: id });
}
function robotsForSale(state) {
  const station = currentStation(state);
  if (station === "science") return Object.keys(ROBOTS);
  if (!atCapital(state)) return [];
  const tech = currentSystem(state).techLevel;
  return Object.keys(ROBOTS).filter((id) => ROBOTS[id].minTechLevel <= tech);
}
function buyRobot(state, id) {
  const robot = ROBOTS[id];
  if (!robot) return fail("error.robotNotHere");
  if (!robotsForSale(state).includes(id)) return fail("error.robotNotHere");
  if (freeQuarters(state.ship) <= 0) return fail("error.noQuarters");
  const price = traderPrice(state, robot.price);
  if (state.credits < price) return fail("error.notEnoughCredits");
  state.credits -= price;
  state.ship.robots = [...state.ship.robots ?? [], id];
  return okInfo("info.robotBought", { robot: id, cost: price });
}
function sellRobot(state, index) {
  if (!hasShipyard(state)) return fail("error.noShipyardHere");
  const robots = state.ship.robots ?? [];
  const id = robots[index];
  if (!id || !ROBOTS[id]) return fail("error.nothingToRemove");
  state.ship.robots = robots.filter((_, i) => i !== index);
  state.credits += Math.round(ROBOTS[id].price * 0.75);
  return okInfo("info.robotSold", { robot: id });
}
function maxLoan(state) {
  const base = 500 + Math.max(0, state.record.policeRecord) * 100;
  return Math.min(25e3, base + Math.floor(shipValue(state.ship) / 10));
}
function getLoan(state, amount) {
  if (!atCapital(state)) return fail("error.noBankHere");
  const available = maxLoan(state) - state.debt;
  const take = Math.min(amount, available);
  if (take <= 0) return fail("error.noLoanAvailable");
  state.debt += take;
  state.credits += take;
  return okInfo("info.loanTaken", { amount: take });
}
function payDebt(state, amount) {
  if (!atCapital(state)) return fail("error.noBankHere");
  const pay = Math.min(amount, state.debt, state.credits);
  if (pay <= 0) return fail("error.nothingToPay");
  state.debt -= pay;
  state.credits -= pay;
  return okInfo("info.debtPaid", { amount: pay });
}
function buyInsurance(state) {
  if (!atCapital(state)) return fail("error.noBankHere");
  if (!state.ship.escapePod) return fail("error.needEscapePod");
  if (state.insurance) return fail("error.alreadyInsured");
  state.insurance = true;
  state.noClaim = 0;
  return okInfo("info.insuranceBought");
}
function cancelInsurance(state) {
  if (!atCapital(state)) return fail("error.noBankHere");
  if (!state.insurance) return fail("error.noInsurance");
  state.insurance = false;
  return okInfo("info.insuranceCancelled");
}
function shipInsuranceValue(state) {
  return SHIP_TYPES[state.ship.type].price;
}
function advanceDay(state, rng) {
  state.day++;
  if (state.debt > 0) {
    const interest = Math.ceil(state.debt * 0.1);
    if (state.credits >= interest) {
      state.credits -= interest;
    } else {
      const unpaid = interest - state.credits;
      state.credits = 0;
      state.debt += unpaid;
    }
  }
  const wages = crewWages(state);
  if (wages > 0) {
    if (state.credits >= wages) {
      state.credits -= wages;
    } else {
      state.ship.crew = [];
      pushLog(state, "log.crewLeft");
    }
  }
  if (state.insurance) {
    const premium = Math.ceil(shipInsuranceValue(state) * 5e-3 * (1 - Math.min(0.9, state.noClaim * 0.01)));
    state.credits = Math.max(0, state.credits - premium);
    state.noClaim++;
  }
  const robots = shipRobots(state).length;
  if (robots > 0) {
    state.robotDrain = (state.robotDrain ?? 0) + robots * ROBOT_FUEL_PER_DAY;
    while (state.robotDrain >= 1 && state.ship.fuel > 0) {
      state.ship.fuel--;
      state.robotDrain--;
    }
    if (state.ship.fuel <= 0) state.robotDrain = 0;
  }
  const patched = Math.min(crewRepairPerDay(state), maxHull(state.ship) - state.ship.hull);
  if (patched > 0) state.ship.hull += patched;
  if (!rng) return null;
  const incident = rollCrewIncident(state, rng);
  if (incident) pushLog(state, incident.bodyKey, incident.params);
  return incident;
}
function fail(error) {
  return { ok: false, error };
}
function okInfo(key, params) {
  return { ok: true, info: { key, params } };
}

// src/game/engine/travel.ts
function systemDistance(a, b) {
  return Math.round(distance(a, b));
}
function maxRange(state) {
  return maxFuel(state.ship);
}
function reachableSystems(state) {
  const here = state.systems[state.currentSystem];
  return state.systems.filter(
    (s) => s.id !== here.id && systemDistance(here, s) <= state.ship.fuel
  );
}
function fuelCost(state, targetId) {
  const here = state.systems[state.currentSystem];
  const target = state.systems[targetId];
  return systemDistance(here, target);
}
function canTravelTo(state, targetId) {
  const here = state.systems[state.currentSystem];
  if (here.wormholeTo === targetId) return true;
  return fuelCost(state, targetId) <= state.ship.fuel;
}

// src/game/engine/reputation.ts
var WANTED_THRESHOLD = 3;
var BANK_BOUNTY_DEBT = 1e4;
var FINE_BASE = 2e3;
var FINE_PER_NOTORIETY = 2500;
var SENTENCE_BASE_DAYS = 5;
var SENTENCE_DAYS_PER_NOTORIETY = 2;
var PRISON_FINE_BASE = 1e3;
var PRISON_FINE_PER_NOTORIETY = 500;
var STANDING_IDS = [
  "outlaw",
  "criminal",
  "rogue",
  "citizen",
  "trusted",
  "defender",
  "champion"
];
var QUEST_KARMA = {
  relief: 2,
  bounty: 3,
  escort: 1,
  smuggle: -3,
  delivery: 0,
  fetch: 0,
  passenger: 0
};
function notoriety(state) {
  return Math.max(0, -state.record.policeRecord);
}
function standing(state) {
  const r = state.record.policeRecord;
  if (r <= -10) return "outlaw";
  if (r <= -5) return "criminal";
  if (r <= -1) return "rogue";
  if (r === 0) return "citizen";
  if (r <= 4) return "trusted";
  if (r <= 9) return "defender";
  return "champion";
}
function applyKarma(state, delta) {
  if (delta === 0) return;
  const before = standing(state);
  state.record.policeRecord += delta;
  const after = standing(state);
  if (after !== before) {
    pushLog(state, "log.standingChanged", { standing: `standing.${after}` });
  }
}
function wantedByLaw(state) {
  return notoriety(state) >= WANTED_THRESHOLD;
}
var PIRACY_KARMA = 3;
function reportPiracy(state) {
  applyKarma(state, -Math.max(PIRACY_KARMA, state.record.policeRecord + WANTED_THRESHOLD));
}
function wantedByBank(state) {
  return state.debt >= BANK_BOUNTY_DEBT;
}
function hunterChance(state) {
  let p = 0;
  if (wantedByLaw(state)) p += Math.min(0.2, 0.02 + notoriety(state) * 0.02);
  if (wantedByBank(state)) p += Math.min(0.15, 0.03 + (state.debt - BANK_BOUNTY_DEBT) / 2e5);
  return Math.min(0.35, p);
}
function hunterEmployer(state, rng) {
  if (wantedByLaw(state) && wantedByBank(state)) return rng.chance(0.5) ? "bank" : "law";
  return wantedByBank(state) ? "bank" : "law";
}
function fineToClear(state) {
  const n = notoriety(state);
  return n <= 0 ? 0 : FINE_BASE + n * FINE_PER_NOTORIETY;
}
function payFine(state) {
  const cost = fineToClear(state);
  if (cost <= 0) return { ok: false, error: "error.recordClean" };
  if (state.credits < cost) return { ok: false, error: "error.notEnoughCredits" };
  state.credits -= cost;
  applyKarma(state, -state.record.policeRecord);
  pushLog(state, "log.finePaid", { amount: cost });
  return { ok: true, info: { key: "info.finePaid", params: { amount: cost } } };
}
function sentenceDays(state) {
  return SENTENCE_BASE_DAYS + notoriety(state) * SENTENCE_DAYS_PER_NOTORIETY;
}
function serveSentence(state) {
  const days = sentenceDays(state);
  const fine = Math.min(state.credits, PRISON_FINE_BASE + notoriety(state) * PRISON_FINE_PER_NOTORIETY);
  const confiscated = state.ship.cargo.firearms + state.ship.cargo.narcotics;
  for (const g of ["firearms", "narcotics"]) {
    releaseLocalSourcing(state, g, state.ship.cargo[g]);
    state.ship.cargo[g] = 0;
    state.buyingPrice[g] = 0;
  }
  state.credits -= fine;
  for (let i = 0; i < days; i++) advanceDay(state);
  if (state.record.policeRecord < 0) applyKarma(state, -state.record.policeRecord);
  pushLog(state, "log.servedSentence", { days, fine });
  return { days, fine, confiscated };
}

// src/game/engine/quests.ts
var BOUNTY_NAMES = [
  "Redjack",
  "Vex",
  "Ktar",
  "Morrigan",
  "Slade",
  "Cutter",
  "Vos",
  "Draska"
];
var PASSENGER_NAMES = [
  "Dr. Okonkwo",
  "Envoy Sarn",
  "Lady Perrin",
  "Prof. Adler",
  "Consul Vane",
  "Captain Reyes",
  "Ambassador Ito",
  "Magnate Hollis"
];
var FETCH_GOODS = ["ore", "food", "machines", "medicine", "robots", "furs"];
var MAX_ACTIVE_QUESTS = 5;
function activeQuests(state) {
  return state.quests.filter((q) => q.status === "active");
}
function hasActiveBounty(state) {
  return state.quests.find((q) => q.status === "active" && q.type === "bounty");
}
function nextQuestId(state) {
  const seq = (state.flags.questSeq ?? 0) + 1;
  state.flags.questSeq = seq;
  return `q${seq}`;
}
function cargoReward(state, good, amount, dist, rng) {
  const unit = questSupplyUnitPrice(state, good);
  const margin = 2.1 + rng.next() * 0.8;
  return Math.round(amount * unit * margin) + dist * 30 + rng.int(400, 1200);
}
function generateQuestOffer(state, rng) {
  if (activeQuests(state).length >= MAX_ACTIVE_QUESTS) return null;
  const here = currentSystem(state);
  const others = state.systems.filter((s) => s.id !== here.id);
  if (others.length === 0) return null;
  const roll = rng.next();
  if (roll < 0.2) {
    const crisis = others.find(
      (s) => s.status === "plague" || s.status === "cropFailure" || s.status === "drought"
    );
    if (crisis) {
      const good = crisis.status === "plague" ? "medicine" : crisis.status === "drought" ? "water" : "food";
      const amount = rng.int(3, 8);
      const reward = cargoReward(state, good, amount, systemDistance(here, crisis), rng);
      return {
        id: nextQuestId(state),
        type: "relief",
        giverSystem: here.id,
        targetSystem: crisis.id,
        reward,
        status: "offered",
        good,
        amount
      };
    }
  }
  if (roll < 0.38) {
    const target2 = rng.pick(others);
    const good = rng.chance(0.5) ? "firearms" : "narcotics";
    const amount = rng.int(2, 6);
    const reward = Math.round(cargoReward(state, good, amount, systemDistance(here, target2), rng) * 1.2);
    return {
      id: nextQuestId(state),
      type: "smuggle",
      giverSystem: here.id,
      targetSystem: target2.id,
      reward,
      status: "offered",
      good,
      amount
    };
  }
  if (roll < 0.55 && freeQuarters(state.ship) > 0) {
    const target2 = rng.pick(others);
    const dist2 = systemDistance(here, target2);
    return {
      id: nextQuestId(state),
      type: "passenger",
      giverSystem: here.id,
      targetSystem: target2.id,
      reward: 500 + dist2 * 70 + rng.int(0, 900),
      status: "offered",
      passengerName: rng.pick(PASSENGER_NAMES)
    };
  }
  if (roll < 0.7) {
    const target2 = rng.pick(others);
    return {
      id: nextQuestId(state),
      type: "bounty",
      giverSystem: here.id,
      targetSystem: target2.id,
      reward: rng.int(2e3, 6e3),
      status: "offered",
      bountyName: rng.pick(BOUNTY_NAMES)
    };
  }
  if (roll < 0.85) {
    const good = rng.pick(FETCH_GOODS);
    const amount = rng.int(3, 8);
    const reward = cargoReward(state, good, amount, 0, rng);
    return {
      id: nextQuestId(state),
      type: "fetch",
      giverSystem: here.id,
      targetSystem: here.id,
      reward,
      status: "offered",
      good,
      amount
    };
  }
  const target = rng.pick(others);
  const dist = systemDistance(here, target);
  return {
    id: nextQuestId(state),
    type: "delivery",
    giverSystem: here.id,
    targetSystem: target.id,
    reward: 400 + dist * 60 + rng.int(0, 800),
    status: "offered"
  };
}
function acceptQuest(state, quest) {
  quest.status = "active";
  state.quests.push(quest);
  pushLog(state, "quest.accepted", questParams(state, quest));
}
function makeBoardQuest(state, rng) {
  const here = currentSystem(state);
  const others = state.systems.filter((s) => s.id !== here.id);
  if (others.length === 0) return null;
  const t = rng.next();
  const amount = t < 0.55 ? rng.int(2, 8) : t < 0.85 ? rng.int(12, 35) : rng.int(40, 70);
  const roll = rng.next();
  if (roll < 0.24) {
    const good = rng.pick(FETCH_GOODS);
    const reward = cargoReward(state, good, amount, 0, rng);
    return { id: nextQuestId(state), type: "fetch", giverSystem: here.id, targetSystem: here.id, reward, status: "offered", good, amount };
  }
  if (roll < 0.42) {
    const target2 = rng.pick(others);
    const good = rng.chance(0.5) ? "firearms" : "narcotics";
    const reward = Math.round(cargoReward(state, good, amount, systemDistance(here, target2), rng) * 1.2);
    return { id: nextQuestId(state), type: "smuggle", giverSystem: here.id, targetSystem: target2.id, reward, status: "offered", good, amount };
  }
  if (roll < 0.6) {
    const crisis = others.find((s) => s.status === "plague" || s.status === "drought" || s.status === "cropFailure") ?? rng.pick(others);
    const good = crisis.status === "plague" ? "medicine" : crisis.status === "drought" ? "water" : "food";
    const reward = cargoReward(state, good, amount, systemDistance(here, crisis), rng);
    return { id: nextQuestId(state), type: "relief", giverSystem: here.id, targetSystem: crisis.id, reward, status: "offered", good, amount };
  }
  if (roll < 0.74 && freeQuarters(state.ship) > 0) {
    const target2 = rng.pick(others);
    const dist2 = systemDistance(here, target2);
    return { id: nextQuestId(state), type: "passenger", giverSystem: here.id, targetSystem: target2.id, reward: 500 + dist2 * 70 + rng.int(0, 900), status: "offered", passengerName: rng.pick(PASSENGER_NAMES) };
  }
  if (roll < 0.82) {
    const target2 = rng.pick(others);
    return { id: nextQuestId(state), type: "bounty", giverSystem: here.id, targetSystem: target2.id, reward: rng.int(2e3, 6e3), status: "offered", bountyName: rng.pick(BOUNTY_NAMES) };
  }
  if (roll < 0.94) {
    const target2 = rng.pick(others);
    const dist2 = systemDistance(here, target2);
    return { id: nextQuestId(state), type: "escort", giverSystem: here.id, targetSystem: target2.id, reward: 1500 + dist2 * 120 + rng.int(0, 1500), status: "offered" };
  }
  const target = rng.pick(others);
  const dist = systemDistance(here, target);
  return { id: nextQuestId(state), type: "delivery", giverSystem: here.id, targetSystem: target.id, reward: 400 + dist * 60 + rng.int(0, 800), status: "offered" };
}
function generateQuestBoard(state, rng) {
  const board = [];
  const n = rng.int(3, 6);
  for (let i = 0; i < n; i++) {
    const q = makeBoardQuest(state, rng);
    if (q) board.push(q);
  }
  return board;
}
function boardQuestProblem(state, quest) {
  if (quest.type === "passenger" && freeQuarters(state.ship) <= 0) return "error.noQuarters";
  if (quest.type === "escort") return escortShipProblem(state);
  const need = questSupply(quest);
  if (need && need.amount > totalCargoBays(state.ship)) return "error.holdTooSmall";
  return null;
}
function acceptBoardQuest(state, questId) {
  if (!atCapital(state)) return { ok: false, error: "error.noPortHere" };
  const sys = currentSystem(state);
  const board = sys.questBoard ?? [];
  const idx = board.findIndex((q2) => q2.id === questId);
  if (idx < 0) return { ok: false, error: "error.questGone" };
  if (activeQuests(state).length >= MAX_ACTIVE_QUESTS) return { ok: false, error: "error.tooManyQuests" };
  const q = board[idx];
  const problem = boardQuestProblem(state, q);
  if (problem) return { ok: false, error: problem };
  board.splice(idx, 1);
  acceptQuest(state, q);
  return { ok: true, info: { key: "quest.accepted", params: questParams(state, q) } };
}
function questSupplyUnitPrice(state, good) {
  const std = standardPrice(TRADE_GOODS[good], currentSystem(state));
  return std > 0 ? std : TRADE_GOODS[good].basePrice;
}
function questSupplyMissing(state, quest) {
  const need = questSupply(quest);
  if (!need) return 0;
  return Math.max(0, need.amount - state.ship.cargo[need.good]);
}
function buyQuestSupplies(state, quest) {
  if (!atCapital(state)) return { ok: false, error: "error.noMarketHere" };
  const need = questSupply(quest);
  if (!need) return { ok: false, error: "error.cannotBuy" };
  const missing = questSupplyMissing(state, quest);
  if (missing <= 0) return { ok: false, error: "error.cannotBuy" };
  const unit = questSupplyUnitPrice(state, need.good);
  const qty = Math.min(missing, Math.floor(state.credits / unit), freeCargoBays(state.ship));
  if (qty <= 0) return { ok: false, error: "error.cannotBuy" };
  const cost = qty * unit;
  const prevQty = state.ship.cargo[need.good];
  const prevCost = state.buyingPrice[need.good] * prevQty;
  state.ship.cargo[need.good] += qty;
  state.buyingPrice[need.good] = state.ship.cargo[need.good] > 0 ? Math.round((prevCost + cost) / state.ship.cargo[need.good]) : 0;
  state.credits -= cost;
  noteLocalSourcing(state, need.good, qty);
  return { ok: true, info: { key: "info.bought", params: { qty, good: need.good, cost } } };
}
function canTurnIn(state, quest) {
  if (quest.status !== "active") return false;
  if (quest.type === "bounty" || quest.type === "escort") return false;
  if (quest.targetSystem !== state.currentSystem) return false;
  if (!atCapital(state)) return false;
  if (quest.type === "delivery" && state.currentSystem === quest.giverSystem) return false;
  const need = questSupply(quest);
  if (need && deliverableUnits(state, need.good) < need.amount) return false;
  return true;
}
function questDemand(state) {
  const demand = {};
  for (const q of activeQuests(state)) {
    const need = questSupply(q);
    if (!need) continue;
    const entry = demand[need.good] ?? { required: 0, have: 0, missing: 0, targets: [] };
    entry.required += need.amount;
    if (!entry.targets.includes(q.targetSystem)) entry.targets.push(q.targetSystem);
    demand[need.good] = entry;
  }
  for (const good of Object.keys(demand)) {
    const entry = demand[good];
    entry.have = Math.min(state.ship.cargo[good], entry.required);
    entry.missing = Math.max(0, entry.required - state.ship.cargo[good]);
  }
  return demand;
}
function questDeliverableMissing(state, quest) {
  const need = questSupply(quest);
  if (!need) return 0;
  return Math.max(0, need.amount - deliverableUnits(state, need.good));
}
function questsReadyToTurnIn(state) {
  return activeQuests(state).filter((q) => canTurnIn(state, q));
}
function turnInQuest(state, questId) {
  const q = state.quests.find((x) => x.id === questId && x.status === "active");
  if (!q || !canTurnIn(state, q)) return null;
  const need = questSupply(q);
  if (need) {
    state.ship.cargo[need.good] -= need.amount;
    if (state.ship.cargo[need.good] === 0) state.buyingPrice[need.good] = 0;
  }
  finishQuest(state, q);
  return q;
}
function abandonQuest(state, questId) {
  const idx = state.quests.findIndex((q2) => q2.id === questId && q2.status === "active");
  if (idx < 0) return { ok: false, error: "error.questGone" };
  const [q] = state.quests.splice(idx, 1);
  pushLog(state, "quest.abandoned", questParams(state, q));
  return { ok: true, info: { key: "quest.abandoned", params: questParams(state, q) } };
}
function completeEscort(state, questId, dangerPay) {
  const q = state.quests.find(
    (x) => x.id === questId && x.status === "active" && x.type === "escort"
  );
  if (!q) return null;
  state.record.reputation += 2;
  if (dangerPay > 0) {
    state.credits += dangerPay;
    pushLog(state, "escort.dangerPay", { amount: dangerPay });
  }
  finishQuest(state, q);
  return q;
}
function completeBounty(state, questId) {
  const q = state.quests.find((x) => x.id === questId && x.status === "active");
  if (!q) return null;
  state.record.reputation += 5;
  finishQuest(state, q);
  return q;
}
function finishQuest(state, q) {
  q.status = "completed";
  state.credits += q.reward;
  applyKarma(state, QUEST_KARMA[q.type]);
  pushLog(state, "quest.completed", questParams(state, q));
}
function questParams(state, q) {
  return {
    reward: q.reward,
    system: state.systems[q.targetSystem]?.nameId ?? "",
    good: q.good ?? "",
    amount: q.amount ?? 0,
    bounty: q.bountyName ?? "",
    passenger: q.passengerName ?? ""
  };
}

// src/game/engine/combat.ts
var CRIT_MULTIPLIER = 2;
var TRACTOR_ACCURACY_BONUS = 0.15;
var POINT_BLANK_RANGE = 6;
var MAX_ENGAGEMENT_RANGE = 40;
var RANGE_ACCURACY_PENALTY = 0.3;
var RANGE_MANOEUVRE_STEP = 7;
function isPeacefulTrader(enc) {
  return enc.kind === "trader" && !enc.provoked;
}
function rollEncounter(state, rng) {
  const dest = state.systems[state.currentSystem];
  const gov = POLITICS[dest.politics];
  if (rng.chance(0.015)) return makeEncounter("alien", state, rng);
  const pHunter = hunterChance(state);
  if (pHunter > 0 && rng.chance(pHunter)) {
    return makeEncounter("bountyHunter", state, rng, hunterEmployer(state, rng));
  }
  const pPirate = pirateEncounterChance(state, gov.strengthPirates * 0.03);
  const pPolice = gov.strengthPolice * 0.025;
  const pTrader = gov.strengthTraders * 0.02;
  const roll = rng.next();
  if (roll < pPirate) return makeEncounter("pirate", state, rng);
  if (roll < pPirate + pPolice) return makeEncounter("police", state, rng);
  if (roll < pPirate + pPolice + pTrader) return makeEncounter("trader", state, rng);
  return null;
}
function threatLevel(kind, state) {
  if (kind === "alien") return 5;
  let worth = state.credits + Math.max(0, state.record.reputation) * 120;
  if (kind === "police") worth += notoriety(state) * 6e3;
  if (kind === "bountyHunter") {
    worth += notoriety(state) * 9e3 + (wantedByBank(state) ? state.debt : 0);
  }
  if (kind === "pirate") worth += pirateCargoValue(state);
  if (worth > 15e4) return 5;
  if (worth > 8e4) return 4;
  if (worth > 4e4) return 3;
  if (worth > 15e3) return 2;
  if (worth > 5e3) return 1;
  return 0;
}
function pirateCargoValue(state) {
  return GOOD_IDS.reduce((total, good) => total + state.ship.cargo[good] * TRADE_GOODS[good].basePrice, 0);
}
function pirateCargoChance(state) {
  const quantityRisk = Math.min(0.12, usedCargoBays(state.ship) / totalCargoBays(state.ship) * 0.12);
  const valueRisk = Math.min(0.28, pirateCargoValue(state) / 5e4 * 0.28);
  return quantityRisk + valueRisk;
}
function pirateEncounterChance(state, baseChance) {
  return Math.min(0.95, Math.max(0, baseChance) + pirateCargoChance(state));
}
function shipForThreat(threat) {
  return ["gnat", "firefly", "mantis", "hornet", "scorpion", "widow"][threat];
}
function makeOpponent(kind, rng, threat) {
  const shipType = kind === "trader" ? rng.pick(["flea", "gnat", "locust", "firefly", "beetle", "centipede"]) : kind === "alien" ? rng.pick(["scorpion", "widow"]) : kind === "bountyHunter" ? rng.pick(["mantis", "hornet", "scorpion"]) : shipForThreat(threat);
  const type = SHIP_TYPES[shipType];
  const shieldTier = threat >= 4 ? "reflective" : "energy";
  const oppShields = type.shieldSlots > 0 ? SHIELDS[shieldTier].power * Math.min(type.shieldSlots, 2) : 0;
  const weaponTier = kind === "alien" ? "fusion" : threat >= 4 ? "military" : threat >= 2 ? "beam" : "pulse";
  const oppWeapon = type.weaponSlots > 0 ? WEAPONS[weaponTier].power * Math.min(type.weaponSlots, 2) : 0;
  const cargo = {};
  for (const g of GOOD_IDS) cargo[g] = 0;
  const lootCount = kind === "trader" ? rng.int(2, Math.min(10, type.cargoBays)) : kind === "pirate" ? rng.int(1, 6) : kind === "alien" ? rng.int(0, 3) : 0;
  for (let i = 0; i < lootCount; i++) cargo[rng.pick(GOOD_IDS)]++;
  const hullMul = kind === "alien" ? 1.5 : kind === "bountyHunter" ? 1.2 : 1;
  const baseHull = Math.round(type.hullStrength * hullMul);
  const skillBonus = kind === "alien" ? 4 : kind === "bountyHunter" ? 2 : 0;
  return {
    kind,
    shipType,
    hull: baseHull,
    maxHull: baseHull,
    shieldPoints: oppShields,
    maxShield: oppShields,
    weaponPower: kind === "police" || kind === "bountyHunter" ? Math.max(oppWeapon, WEAPONS.pulse.power) : oppWeapon,
    pilot: Math.min(13, rng.int(3, 8) + threat + skillBonus),
    fighter: Math.min(13, rng.int(3, 8) + threat + skillBonus),
    cargo,
    fleeing: false,
    distance: rng.int(POINT_BLANK_RANGE, MAX_ENGAGEMENT_RANGE)
  };
}
function richestCargo(state) {
  let best = null;
  let bestValue = 0;
  for (const g of GOOD_IDS) {
    const value = state.ship.cargo[g] * TRADE_GOODS[g].basePrice;
    if (value > bestValue) {
      bestValue = value;
      best = g;
    }
  }
  return best;
}
function openingDemand(kind, state, hiredBy) {
  if (kind === "pirate") {
    const prize = richestCargo(state);
    if (!prize) return { key: "encounter.pirate.demandEmpty" };
    const laden = usedCargoBays(state.ship) * 2 >= totalCargoBays(state.ship);
    return {
      key: laden ? "encounter.pirate.demandRich" : "encounter.pirate.demandCargo",
      params: { good: prize }
    };
  }
  if (kind === "bountyHunter") {
    return hiredBy === "bank" ? { key: "encounter.bountyHunter.demandBank", params: { debt: state.debt } } : {
      key: "encounter.bountyHunter.demandLaw",
      params: { standing: `standing.${standing(state)}` }
    };
  }
  return null;
}
function makeEncounter(kind, state, rng, hiredBy) {
  const threat = threatLevel(kind, state);
  let fleetSize = 1;
  if (kind === "pirate" && rng.chance(0.2 + threat * 0.05)) {
    fleetSize = rng.int(2, Math.min(5, 2 + threat));
  } else if (kind === "trader" && rng.chance(0.3)) fleetSize = rng.int(2, 4);
  const group = [];
  for (let i = 0; i < fleetSize; i++) group.push(makeOpponent(kind, rng, threat));
  group.sort((a, b) => a.distance - b.distance);
  const opponent = group[0];
  const reserves = group.slice(1);
  let trade;
  if (kind === "trader" && fleetSize === 1) {
    trade = makeTradeOffer(rng);
    for (const g of GOOD_IDS) {
      const s = trade.sells[g];
      if (s) opponent.cargo[g] = s.qty;
    }
  }
  const canBribe = kind === "police" || kind === "bountyHunter";
  const bribeCost = canBribe && POLITICS[state.systems[state.currentSystem].politics].bribeLevel > 0 ? rng.int(100, 100 + Math.round(state.credits * 0.05)) : 0;
  const appear = fleetSize > 1 ? kind === "pirate" ? { key: "encounter.pirate.ambush", params: { count: fleetSize } } : { key: "encounter.trader.caravan", params: { count: fleetSize } } : {
    key: kind === "bountyHunter" && hiredBy === "bank" ? "encounter.bountyHunter.appearBank" : `encounter.${kind}.appear`,
    params: { ship: opponent.shipType }
  };
  const messages = [appear];
  const demandLine = openingDemand(kind, state, hiredBy);
  if (demandLine) messages.push(demandLine);
  return {
    kind,
    opponent,
    reserves,
    fleetSize,
    defeated: 0,
    downed: [],
    status: "ongoing",
    actionsLeft: battleStations(state).actions,
    actionsPerRound: battleStations(state).actions,
    round: 0,
    seed: rng.int(0, 2147483647),
    bribeCost,
    demand: kind === "pirate" ? "cargo" : kind === "bountyHunter" ? "arrest" : void 0,
    hiredBy: kind === "bountyHunter" ? hiredBy ?? "law" : void 0,
    trade,
    messages
  };
}
function startTurn(state, enc) {
  const stations = battleStations(state);
  enc.actionsPerRound = stations.actions;
  enc.actionsLeft = stations.actions;
}
function engageNext(state, enc) {
  const next = enc.reserves.shift();
  if (!next) return false;
  enc.opponent = next;
  enc.status = "ongoing";
  startTurn(state, enc);
  enc.messages.push({ key: "encounter.fleetNext", params: { remaining: enc.reserves.length + 1 } });
  return true;
}
function setTarget(enc, index) {
  if (enc.status !== "ongoing") return false;
  const chosen = enc.reserves[index];
  if (!chosen) return false;
  enc.reserves[index] = enc.opponent;
  enc.opponent = chosen;
  enc.messages.push({ key: "encounter.targetSwitched", params: { ship: chosen.shipType } });
  return true;
}
function dropLoot(state, opp, rng, msg) {
  let taken = 0;
  for (const g of GOOD_IDS) {
    while (opp.cargo[g] > 0 && freeCargoBays(state.ship) > 0) {
      opp.cargo[g]--;
      state.ship.cargo[g]++;
      taken++;
    }
  }
  if (taken > 0) {
    msg("encounter.lootDropped", { qty: taken });
  } else if (rng.chance(0.4) && freeCargoBays(state.ship) > 0) {
    const g = pickLoot(opp, rng);
    if (g) {
      state.ship.cargo[g]++;
      msg("encounter.salvage", { good: g });
    }
  }
}
function shuffled2(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeTradeOffer(rng) {
  const sells = {};
  const buys = {};
  for (const g of shuffled2(GOOD_IDS, rng).slice(0, rng.int(3, 6))) {
    const base = TRADE_GOODS[g].basePrice;
    sells[g] = {
      price: Math.max(1, Math.round(base * (0.6 + rng.next() * 0.55))),
      qty: rng.int(1, 8)
    };
  }
  for (const g of shuffled2(GOOD_IDS, rng).slice(0, rng.int(2, 4))) {
    const base = TRADE_GOODS[g].basePrice;
    buys[g] = Math.max(1, Math.round(base * (0.75 + rng.next() * 0.5)));
  }
  return { sells, buys };
}
function tradeBuy(state, enc, good, amount) {
  if (enc.kind !== "trader" || enc.status !== "ongoing" || !enc.trade) {
    return { ok: false, error: "error.cannotBuy" };
  }
  const offer = enc.trade.sells[good];
  if (!offer || offer.qty <= 0) return { ok: false, error: "error.notSold" };
  const unit = offer.price;
  const qty = Math.min(
    amount,
    offer.qty,
    Math.floor(state.credits / unit),
    freeCargoBays(state.ship)
  );
  if (qty <= 0) return { ok: false, error: "error.cannotBuy" };
  const cost = qty * unit;
  const prevQty = state.ship.cargo[good];
  const prevCost = state.buyingPrice[good] * prevQty;
  state.ship.cargo[good] += qty;
  state.buyingPrice[good] = state.ship.cargo[good] > 0 ? Math.round((prevCost + cost) / state.ship.cargo[good]) : 0;
  state.credits -= cost;
  offer.qty -= qty;
  enc.opponent.cargo[good] = Math.max(0, enc.opponent.cargo[good] - qty);
  return { ok: true, info: { key: "info.bought", params: { qty, good, cost } } };
}
function tradeSell(state, enc, good, amount) {
  if (enc.kind !== "trader" || enc.status !== "ongoing" || !enc.trade) {
    return { ok: false, error: "error.notWanted" };
  }
  const unit = enc.trade.buys[good];
  if (!unit || unit <= 0) return { ok: false, error: "error.notWanted" };
  const have = state.ship.cargo[good];
  if (have <= 0) return { ok: false, error: "error.nothingToSell" };
  if (amount <= 0) return { ok: false, error: "error.nothingToSell" };
  const qty = Math.min(amount, have);
  const revenue = qty * unit;
  state.ship.cargo[good] -= qty;
  state.credits += revenue;
  releaseLocalSourcing(state, good, qty);
  if (state.ship.cargo[good] === 0) state.buyingPrice[good] = 0;
  enc.opponent.cargo[good] = (enc.opponent.cargo[good] ?? 0) + qty;
  return { ok: true, info: { key: "info.sold", params: { qty, good, revenue } } };
}
function spawnPirates(state, rng) {
  return makeEncounter("pirate", state, rng);
}
function spawnEncounter(kind, state, rng, hiredBy) {
  return makeEncounter(kind, state, rng, hiredBy);
}
function createBountyEncounter(state, questId, bountyName, rng) {
  const enc = makeEncounter("pirate", state, rng);
  const type = SHIP_TYPES[enc.opponent.shipType];
  enc.reserves = [];
  enc.fleetSize = 1;
  enc.opponent.hull = Math.round(type.hullStrength * 1.3);
  enc.opponent.maxHull = enc.opponent.hull;
  enc.opponent.fighter = Math.min(12, enc.opponent.fighter + 2);
  enc.opponent.pilot = Math.min(12, enc.opponent.pilot + 2);
  enc.bountyQuestId = questId;
  enc.bountyName = bountyName;
  enc.messages = [{ key: "encounter.bounty.appear", params: { bounty: bountyName } }];
  return enc;
}
function rangePenalty(distance2) {
  const span = MAX_ENGAGEMENT_RANGE - POINT_BLANK_RANGE;
  const over = Math.max(0, Math.min(span, distance2 - POINT_BLANK_RANGE));
  return over / span * RANGE_ACCURACY_PENALTY;
}
function hitChance(attackerFighter, defenderPilot, distance2 = POINT_BLANK_RANGE) {
  const diff = attackerFighter - defenderPilot;
  return Math.min(0.95, Math.max(0.1, 0.55 + diff * 0.05 - rangePenalty(distance2)));
}
function playerHitChance(state, enc, target = enc.opponent) {
  return hitChance(effectiveSkills(state).fighter, target.pilot, target.distance);
}
function opponentHitChance(state, enc) {
  const opp = enc.opponent;
  const raw = hitChance(opp.fighter, effectiveSkills(state).pilot, opp.distance);
  return Math.min(0.95, raw + (enc.tractorLocked ? TRACTOR_ACCURACY_BONUS : 0));
}
function critChance(attackerFighter, hasTargeting) {
  return Math.min(0.4, 0.05 + attackerFighter * 0.015 + (hasTargeting ? 0.08 : 0));
}
function applyDamage(target, amount) {
  if (amount <= 0) return { absorbed: 0, hullDamage: 0, shieldsDown: false };
  const hadShields = target.shieldPoints > 0;
  const absorbed = Math.min(target.shieldPoints, amount);
  target.shieldPoints -= absorbed;
  const hullDamage = amount - absorbed;
  target.hull = Math.max(0, target.hull - hullDamage);
  return { absorbed, hullDamage, shieldsDown: hadShields && target.shieldPoints === 0 };
}
function tractorChance(state, enc) {
  if (enc.kind === "trader" || enc.kind === "police") return 0;
  const mine = sizeRank(state.ship.type);
  const ships = [enc.opponent, ...enc.reserves];
  const gap = Math.max(...ships.map((o) => sizeRank(o.shipType))) - mine;
  if (gap <= 0) return 0;
  if (ships.length < 2 && gap < 2) return 0;
  const raw = gap * 0.12 + (ships.length - 1) * 0.06 - effectiveSkills(state).pilot * 0.01;
  return Math.max(0, Math.min(0.5, raw));
}
function breakLockChance(state, enc) {
  const skills = effectiveSkills(state);
  const gap = Math.max(0, sizeRank(enc.opponent.shipType) - sizeRank(state.ship.type));
  const raw = 0.15 + skills.engineer * 0.03 + skills.pilot * 0.02 - gap * 0.05;
  return Math.max(0.05, Math.min(0.8, raw));
}
function fleeChance(state, enc, pilot) {
  const sizeEdge = (sizeRank(enc.opponent.shipType) - sizeRank(state.ship.type)) * 0.1;
  const raw = hitChance(pilot, enc.opponent.fighter) + sizeEdge;
  return Math.max(0.05, Math.min(0.95, raw));
}
function resolveRound(state, enc, action, rng) {
  if (enc.status !== "ongoing") return;
  if (action === "flee" && isPeacefulTrader(enc)) return;
  if (action === "ignore" && enc.kind === "trader" && enc.provoked) return;
  enc.round++;
  const skills = effectiveSkills(state);
  const opp = enc.opponent;
  const playerWeapon = weaponPower(state.ship);
  const msg = (key, params) => enc.messages.push({ key, params });
  if (action === "ignore") {
    enc.status = "ignored";
    return;
  }
  if (action === "submit" && enc.kind === "police") {
    const illegal = state.ship.cargo.firearms + state.ship.cargo.narcotics;
    if (illegal > 0 && state.ship.gadgets.includes("hiddenCompartment") && rng.chance(0.6)) {
      applyKarma(state, 1);
      msg("encounter.police.hidden");
      enc.status = "inspected";
      return;
    }
    if (illegal > 0) {
      for (const g of ["firearms", "narcotics"]) {
        releaseLocalSourcing(state, g, state.ship.cargo[g]);
        state.ship.cargo[g] = 0;
        state.buyingPrice[g] = 0;
      }
      const fine = 500 + illegal * 50;
      state.credits = Math.max(0, state.credits - fine);
      applyKarma(state, -3);
      msg("encounter.police.impound", { fine });
      enc.status = "inspected";
    } else {
      applyKarma(state, 1);
      msg("encounter.police.clean");
      enc.status = "inspected";
    }
    return;
  }
  if (action === "bribe" && (enc.kind === "police" || enc.kind === "bountyHunter")) {
    if (enc.bribeCost <= 0) {
      msg("encounter.police.incorruptible");
      return;
    }
    if (state.credits >= enc.bribeCost) {
      state.credits -= enc.bribeCost;
      msg(`encounter.${enc.kind}.bribed`, { amount: enc.bribeCost });
      enc.status = "bribed";
    } else {
      msg("error.notEnoughCredits");
    }
    return;
  }
  if (action === "surrender") {
    if (enc.kind === "pirate") {
      let looted = 0;
      for (const g of GOOD_IDS) {
        looted += state.ship.cargo[g];
        releaseLocalSourcing(state, g, state.ship.cargo[g]);
        state.ship.cargo[g] = 0;
        state.buyingPrice[g] = 0;
      }
      if (looted === 0) {
        const extort = Math.min(state.credits, Math.round(state.credits * 0.5));
        state.credits -= extort;
        msg("encounter.pirate.extort", { amount: extort });
      } else {
        msg("encounter.pirate.plundered", { qty: looted });
      }
      msg("encounter.pirate.released");
      enc.status = "playerSurrendered";
    } else if (enc.kind === "police") {
      const fine = Math.min(state.credits, 1e3);
      state.credits -= fine;
      applyKarma(state, -1);
      msg("encounter.police.arrested", { fine });
      enc.status = "playerSurrendered";
    } else if (enc.kind === "bountyHunter") {
      const sentence = serveSentence(state);
      msg("encounter.bountyHunter.arrested", { days: sentence.days, fine: sentence.fine });
      if (sentence.confiscated > 0) {
        msg("encounter.bountyHunter.confiscated", { qty: sentence.confiscated });
      }
      enc.status = "playerArrested";
    }
    return;
  }
  if (action === "plunder" && enc.status === "ongoing" && opp.hull <= 0) {
    return;
  }
  if (action === "flee") {
    if (!enc.tractorLocked && rng.chance(tractorChance(state, enc))) {
      enc.tractorLocked = true;
      msg("encounter.tractor.locked");
    }
    if (enc.tractorLocked) {
      if (rng.chance(breakLockChance(state, enc))) {
        enc.tractorLocked = false;
        msg("encounter.tractor.broke");
      } else {
        msg("encounter.tractor.held");
        if (opp.weaponPower > 0) {
          if (rng.chance(opponentHitChance(state, enc))) {
            dealDamageToPlayer(state, opp, rng, msg);
          } else {
            msg("encounter.oppMiss");
          }
        }
        checkPlayerDestroyed(state, enc, msg);
        if (enc.status === "ongoing") startTurn(state, enc);
        return;
      }
    }
    if (opp.weaponPower > 0 && !opp.fleeing) {
      if (rng.chance(opponentHitChance(state, enc))) {
        dealDamageToPlayer(state, opp, rng, msg);
      }
    }
    if (rng.chance(fleeChance(state, enc, skills.pilot))) {
      enc.status = "playerFled";
      msg("encounter.fledSuccess");
    } else {
      msg("encounter.fledFail");
    }
    checkPlayerDestroyed(state, enc, msg);
    if (enc.status === "ongoing") startTurn(state, enc);
    return;
  }
  if (action === "closeIn" || action === "openRange") {
    const before = opp.distance;
    opp.distance = action === "closeIn" ? Math.max(POINT_BLANK_RANGE, opp.distance - RANGE_MANOEUVRE_STEP) : Math.min(MAX_ENGAGEMENT_RANGE, opp.distance + RANGE_MANOEUVRE_STEP);
    if (opp.distance === before) {
      msg(action === "closeIn" ? "encounter.range.atPointBlank" : "encounter.range.atMax", {
        distance: opp.distance
      });
    } else {
      msg(action === "closeIn" ? "encounter.range.closed" : "encounter.range.opened", {
        distance: opp.distance
      });
    }
  }
  if (action === "attack") {
    if (isPeacefulTrader(enc) && playerWeapon > 0) {
      enc.provoked = true;
      reportPiracy(state);
      msg("encounter.trader.distress");
    }
    if (playerWeapon <= 0) {
      msg("encounter.noWeapons");
    } else if (rng.chance(playerHitChance(state, enc))) {
      let dmg = playerWeapon + rng.int(0, Math.round(playerWeapon * 0.3));
      const fireControl = state.ship.gadgets.includes("targeting") || state.ship.gadgets.includes("battleComputer");
      const crit = rng.chance(critChance(skills.fighter, fireControl));
      if (crit) dmg = Math.round(dmg * CRIT_MULTIPLIER);
      const hit = applyDamage(opp, dmg);
      msg(crit ? "encounter.playerCrit" : "encounter.playerHit", { dmg });
      if (hit.shieldsDown) msg("encounter.oppShieldDown");
      else if (hit.hullDamage === 0 && hit.absorbed > 0) {
        msg("encounter.oppShieldsHeld", { absorbed: hit.absorbed });
      }
      if (opp.hull > 0 && opp.hull <= opp.maxHull * 0.25) msg("encounter.oppCrippled");
    } else {
      msg("encounter.playerMiss");
    }
    if (opp.hull <= 0) {
      state.record.reputation += 1;
      if (enc.kind === "pirate") applyKarma(state, 1);
      if (enc.kind === "police") applyKarma(state, -5);
      if (enc.kind === "bountyHunter") {
        state.record.reputation += 2;
        if (enc.hiredBy !== "bank") applyKarma(state, -1);
      }
      if (enc.kind === "alien") state.record.reputation += 3;
      if (enc.bountyQuestId) {
        const q = completeBounty(state, enc.bountyQuestId);
        if (q) msg("encounter.bounty.done", { bounty: enc.bountyName ?? "", reward: q.reward });
      }
      dropLoot(state, opp, rng, msg);
      enc.defeated++;
      enc.downed.push(opp.shipType);
      msg("encounter.oppDestroyed");
      if (!engageNext(state, enc)) enc.status = "oppDestroyed";
      return;
    }
    if ((enc.kind === "trader" || enc.kind === "pirate") && opp.hull < opp.maxHull * 0.3 && rng.chance(0.3)) {
      enc.status = "oppSurrendered";
      msg("encounter.oppSurrendered");
      return;
    }
  }
  if (action !== "endTurn") {
    enc.actionsLeft = Math.max(0, enc.actionsLeft - 1);
    if (enc.actionsLeft > 0) return;
  }
  const oppWillFight = enc.kind === "pirate" || enc.kind === "police" || enc.kind === "bountyHunter" || enc.kind === "alien" || enc.kind === "trader" && enc.provoked === true;
  if (oppWillFight && opp.weaponPower > 0) {
    if (rng.chance(opponentHitChance(state, enc))) {
      dealDamageToPlayer(state, opp, rng, msg);
    } else {
      msg("encounter.oppMiss");
    }
  }
  if ((enc.kind === "pirate" || enc.kind === "bountyHunter") && state.ship.hull > 0 && state.ship.hull <= maxHull(state.ship) * 0.35 && rng.chance(0.4)) {
    msg(`encounter.${enc.kind}.pressSurrender`);
  }
  checkPlayerDestroyed(state, enc, msg);
  if (enc.status === "ongoing") startTurn(state, enc);
}
function dealDamageToPlayer(state, opp, rng, msg) {
  const power = opp.weaponPower;
  let dmg = power + rng.int(0, Math.round(power * 0.3));
  const crit = rng.chance(critChance(opp.fighter, false));
  if (crit) dmg = Math.round(dmg * CRIT_MULTIPLIER);
  const hadShields = state.ship.shieldPoints.some((p) => p > 0);
  let remaining = dmg;
  for (let i = 0; i < state.ship.shieldPoints.length && remaining > 0; i++) {
    const absorbed = Math.min(state.ship.shieldPoints[i], remaining);
    state.ship.shieldPoints[i] -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) state.ship.hull = Math.max(0, state.ship.hull - remaining);
  msg(crit ? "encounter.oppCrit" : "encounter.oppHit", { dmg });
  const shieldsDown = hadShields && state.ship.shieldPoints.every((p) => p <= 0);
  if (shieldsDown) msg("encounter.playerShieldDown");
  else if (remaining === 0 && dmg > 0) msg("encounter.playerShieldsHeld", { absorbed: dmg });
  if (state.ship.hull > 0 && state.ship.hull <= maxHull(state.ship) * 0.25) {
    msg("encounter.playerCrippled");
  }
}
function checkPlayerDestroyed(state, enc, msg) {
  if (state.ship.hull <= 0) {
    if (state.ship.escapePod) {
      msg("encounter.escapePod");
      enc.status = "playerDestroyed";
    } else {
      msg("encounter.playerDestroyed");
      enc.status = "playerDestroyed";
    }
  }
}
function pickLoot(opp, rng) {
  const available = GOOD_IDS.filter((g) => opp.cargo[g] > 0);
  if (available.length === 0) return rng.chance(0.5) ? "water" : null;
  return rng.pick(available);
}
function plunder(state, enc) {
  let taken = 0;
  for (const g of GOOD_IDS) {
    while (enc.opponent.cargo[g] > 0 && freeCargoBays(state.ship) > 0) {
      enc.opponent.cargo[g]--;
      state.ship.cargo[g]++;
      taken++;
    }
  }
  if (enc.kind === "trader" && taken > 0) {
    applyKarma(state, -2);
    pushLog(state, "log.plunderedTrader", { qty: taken });
  }
  enc.defeated++;
  enc.downed.push(enc.opponent.shipType);
  if (!engageNext(state, enc)) enc.status = "ignored";
  return taken;
}

// src/game/engine/events.ts
var EVENTS = [
  {
    id: "derelict",
    weight: 3,
    run: (state, rng) => {
      if (freeCargoBays(state.ship) <= 0) return null;
      const qty = Math.min(freeCargoBays(state.ship), rng.int(1, 5));
      const good = rng.pick(GOOD_IDS);
      state.ship.cargo[good] += qty;
      pushLog(state, "event.derelict.log", { qty, good });
      return {
        id: "derelict",
        titleKey: "event.derelict.title",
        bodyKey: "event.derelict.body",
        params: { qty, good }
      };
    }
  },
  {
    id: "fuelLeak",
    weight: 2,
    run: (state, rng) => {
      if (state.ship.fuel <= 1) return null;
      const lost = Math.min(state.ship.fuel - 1, rng.int(1, 3));
      state.ship.fuel -= lost;
      pushLog(state, "event.fuelLeak.log", { lost });
      return {
        id: "fuelLeak",
        titleKey: "event.fuelLeak.title",
        bodyKey: "event.fuelLeak.body",
        params: { lost }
      };
    }
  },
  {
    id: "micrometeorite",
    weight: 2,
    run: (state, rng) => {
      if (state.ship.hull <= 10) return null;
      const dmg = Math.min(state.ship.hull - 5, rng.int(3, Math.max(4, Math.round(maxHull(state.ship) * 0.15))));
      state.ship.hull -= dmg;
      pushLog(state, "event.micrometeorite.log", { dmg });
      return {
        id: "micrometeorite",
        titleKey: "event.micrometeorite.title",
        bodyKey: "event.micrometeorite.body",
        params: { dmg }
      };
    }
  },
  {
    id: "lottery",
    weight: 2,
    run: (state, rng) => {
      const prize = rng.int(200, 2e3);
      state.credits += prize;
      pushLog(state, "event.lottery.log", { prize });
      return {
        id: "lottery",
        titleKey: "event.lottery.title",
        bodyKey: "event.lottery.body",
        params: { prize }
      };
    }
  },
  {
    id: "toll",
    weight: 2,
    run: (state, rng) => {
      const toll = Math.min(state.credits, rng.int(50, 400));
      if (toll <= 0) return null;
      state.credits -= toll;
      pushLog(state, "event.toll.log", { toll });
      return {
        id: "toll",
        titleKey: "event.toll.title",
        bodyKey: "event.toll.body",
        params: { toll }
      };
    }
  },
  {
    id: "newsTip",
    weight: 3,
    run: (state, rng) => {
      const interesting = state.systems.filter((s) => s.status !== "uneventful");
      if (interesting.length === 0) return null;
      const tip = rng.pick(interesting);
      return {
        id: "newsTip",
        titleKey: "event.newsTip.title",
        bodyKey: "event.newsTip.body",
        params: { system: tip.nameId, status: `status.${tip.status}` }
      };
    }
  },
  {
    id: "wanderer",
    weight: 2,
    run: (state) => {
      if ((state.flags.wandererMet ?? 0) >= 1) return null;
      state.flags.wandererMet = 1;
      state.skills.engineer = Math.min(MAX_SKILL, state.skills.engineer + 1);
      pushLog(state, "event.wanderer.log");
      return {
        id: "wanderer",
        titleKey: "event.wanderer.title",
        bodyKey: "event.wanderer.body"
      };
    }
  },
  {
    id: "ionStorm",
    weight: 2,
    run: (state, rng) => {
      if (state.ship.hull <= 12) return null;
      const dmg = Math.min(state.ship.hull - 6, rng.int(4, Math.max(5, Math.round(maxHull(state.ship) * 0.12))));
      state.ship.hull -= dmg;
      pushLog(state, "event.ionStorm.log", { dmg });
      return {
        id: "ionStorm",
        titleKey: "event.ionStorm.title",
        bodyKey: "event.ionStorm.body",
        params: { dmg }
      };
    }
  },
  {
    id: "skillTrainer",
    weight: 2,
    run: (state, rng) => {
      const trainable = [
        { skill: "pilot", flag: "trainedPilot" },
        { skill: "fighter", flag: "trainedFighter" },
        { skill: "trader", flag: "trainedTrader" },
        { skill: "electrician", flag: "trainedElectrician" }
      ];
      const options = trainable.filter(
        (o) => (state.flags[o.flag] ?? 0) < 1 && state.skills[o.skill] < MAX_SKILL
      );
      if (options.length === 0) return null;
      const choice = rng.pick(options);
      state.flags[choice.flag] = 1;
      state.skills[choice.skill] = Math.min(MAX_SKILL, state.skills[choice.skill] + 1);
      pushLog(state, "event.skillTrainer.log", { skill: `skill.${choice.skill}` });
      return {
        id: "skillTrainer",
        titleKey: "event.skillTrainer.title",
        bodyKey: "event.skillTrainer.body",
        params: { skill: `skill.${choice.skill}` }
      };
    }
  },
  {
    id: "merchantConvoy",
    weight: 3,
    run: (state, rng) => {
      if (freeCargoBays(state.ship) > 0 && rng.chance(0.5)) {
        const qty = Math.min(freeCargoBays(state.ship), rng.int(1, 4));
        const good = rng.pick(GOOD_IDS);
        state.ship.cargo[good] += qty;
        pushLog(state, "event.merchantConvoy.logGoods", { qty, good });
        const ev2 = {
          id: "merchantConvoy",
          titleKey: "event.merchantConvoy.title",
          bodyKey: "event.merchantConvoy.bodyGoods",
          params: { qty, good }
        };
        return ev2;
      }
      const gift = rng.int(150, 900);
      state.credits += gift;
      pushLog(state, "event.merchantConvoy.logCredits", { gift });
      const ev = {
        id: "merchantConvoy",
        titleKey: "event.merchantConvoy.title",
        bodyKey: "event.merchantConvoy.bodyCredits",
        params: { gift }
      };
      return ev;
    }
  },
  {
    id: "refugees",
    weight: 2,
    run: (state, rng) => {
      const aid = Math.min(state.credits, rng.int(100, 500));
      if (aid < 100) return null;
      state.credits -= aid;
      state.record.reputation += 1;
      pushLog(state, "event.refugees.log", { aid });
      return {
        id: "refugees",
        titleKey: "event.refugees.title",
        bodyKey: "event.refugees.body",
        params: { aid }
      };
    }
  },
  {
    id: "bountyPayout",
    weight: 2,
    run: (state, rng) => {
      if (state.record.reputation < 4) return null;
      const reward = rng.int(400, 1200) + state.record.reputation * 60;
      state.credits += reward;
      pushLog(state, "event.bountyPayout.log", { reward });
      return {
        id: "bountyPayout",
        titleKey: "event.bountyPayout.title",
        bodyKey: "event.bountyPayout.body",
        params: { reward }
      };
    }
  },
  {
    id: "ancientProbe",
    weight: 2,
    run: (state, rng) => {
      const value = rng.int(500, 1800);
      state.credits += value;
      pushLog(state, "event.ancientProbe.log", { value });
      return {
        id: "ancientProbe",
        titleKey: "event.ancientProbe.title",
        bodyKey: "event.ancientProbe.body",
        params: { value }
      };
    }
  }
];
var TOTAL_WEIGHT = EVENTS.reduce((s, e) => s + e.weight, 0);
function maybeTriggerEvent(state, rng, chance = 0.22) {
  if (!rng.chance(chance)) return null;
  for (let attempt = 0; attempt < 5; attempt++) {
    let roll = rng.int(0, TOTAL_WEIGHT - 1);
    let chosen = EVENTS[0];
    for (const e of EVENTS) {
      if (roll < e.weight) {
        chosen = e;
        break;
      }
      roll -= e.weight;
    }
    const result = chosen.run(state, rng);
    if (result) return result;
  }
  return null;
}

// src/game/engine/news.ts
var AUTHORITARIAN = [
  "dictatorship",
  "fascist",
  "military",
  "theocracy",
  "monarchy",
  "feudal"
];
var isAuthoritarian = (sys) => AUTHORITARIAN.includes(sys.politics);
var TEMPLATES = [
  // --- The crisis the planet is living through -------------------------------
  {
    id: "droughtDecree",
    weight: 5,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "drought" && isAuthoritarian(s)
  },
  {
    id: "droughtRation",
    weight: 3,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "drought"
  },
  {
    id: "droughtWaterTrain",
    weight: 3,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "drought"
  },
  {
    id: "cropFailureGranary",
    weight: 4,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "cropFailure"
  },
  {
    id: "cropFailureFarmhands",
    weight: 4,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "cropFailure" && s.economyType === "agricultural"
  },
  {
    id: "cropFailureSeedVault",
    weight: 3,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "cropFailure"
  },
  {
    id: "plagueQuarantine",
    weight: 4,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "plague"
  },
  {
    id: "plagueBorder",
    weight: 4,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "plague" && isAuthoritarian(s)
  },
  {
    id: "plagueClinicShip",
    weight: 3,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "plague"
  },
  {
    id: "warLevy",
    weight: 4,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "war"
  },
  {
    id: "warBlackMarket",
    weight: 3,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "war"
  },
  {
    id: "warRefugeeCorridor",
    weight: 3,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "war"
  },
  {
    id: "coldSnap",
    weight: 4,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "cold"
  },
  {
    id: "thermalShelters",
    weight: 3,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "cold"
  },
  {
    id: "boredomFestival",
    weight: 4,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "boredom"
  },
  {
    id: "workerShortage",
    weight: 4,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "lackOfWorkers"
  },
  {
    id: "workerAutomation",
    weight: 3,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "lackOfWorkers"
  },
  {
    id: "workerRecruiters",
    weight: 3,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "lackOfWorkers"
  },
  {
    id: "droughtWellRiot",
    weight: 2,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "drought"
  },
  {
    id: "plagueVolunteers",
    weight: 2,
    tone: "good",
    crisis: true,
    when: (s) => s.status === "plague"
  },
  {
    id: "warCeasefireTalks",
    weight: 3,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "war"
  },
  {
    id: "coldFuelQueues",
    weight: 3,
    tone: "bad",
    crisis: true,
    when: (s) => s.status === "cold"
  },
  {
    id: "boredomTalentShow",
    weight: 3,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "boredom"
  },
  {
    id: "boredomRacing",
    weight: 3,
    tone: "neutral",
    crisis: true,
    when: (s) => s.status === "boredom"
  },
  // --- Who is in charge, and how it feels ------------------------------------
  {
    id: "electionSeason",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "democracy" || s.politics === "confederacy"
  },
  {
    id: "pollingDay",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "democracy" || s.politics === "confederacy"
  },
  {
    id: "partyQuota",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "communist" || s.politics === "socialist"
  },
  {
    id: "corporateMerger",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "corporate" || s.politics === "capitalist"
  },
  {
    id: "shareholderPanic",
    weight: 3,
    tone: "bad",
    when: (s) => s.politics === "corporate" || s.politics === "capitalist"
  },
  {
    id: "piracyRife",
    weight: 4,
    tone: "bad",
    when: (s) => s.politics === "anarchy"
  },
  {
    id: "templeFast",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "theocracy"
  },
  {
    id: "royalTour",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "monarchy" || s.politics === "feudal"
  },
  {
    id: "cyberNet",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "cybernetic"
  },
  {
    id: "satoriSilence",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "satori"
  },
  {
    id: "technocratPaper",
    weight: 3,
    tone: "good",
    when: (s) => s.politics === "technocracy"
  },
  {
    id: "juntaParade",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "military" || s.politics === "fascist" || s.politics === "dictatorship"
  },
  {
    id: "pacifistRally",
    weight: 3,
    tone: "good",
    when: (s) => s.politics === "pacifist"
  },
  {
    id: "democracyScandal",
    weight: 3,
    tone: "bad",
    when: (s) => s.politics === "democracy" || s.politics === "confederacy"
  },
  {
    id: "communeBrigade",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "communist" || s.politics === "socialist"
  },
  {
    id: "anarchyNoLaw",
    weight: 3,
    tone: "neutral",
    when: (s) => s.politics === "anarchy"
  },
  {
    id: "theocracyPilgrimage",
    weight: 3,
    tone: "good",
    when: (s) => s.politics === "theocracy"
  },
  {
    id: "militaryDraft",
    weight: 3,
    tone: "bad",
    when: (s) => s.politics === "military" || s.politics === "fascist" || s.politics === "dictatorship"
  },
  {
    id: "cyberneticGlitch",
    weight: 3,
    tone: "bad",
    when: (s) => s.politics === "cybernetic"
  },
  // --- What the planet lives off ---------------------------------------------
  {
    id: "oreStrike",
    weight: 3,
    tone: "neutral",
    when: (s) => s.economyType === "mining"
  },
  {
    id: "mineAutomation",
    weight: 3,
    tone: "good",
    when: (s) => s.economyType === "mining"
  },
  {
    id: "refineryFlare",
    weight: 3,
    tone: "neutral",
    when: (s) => s.economyType === "refinery"
  },
  {
    id: "refineryCatalyst",
    weight: 3,
    tone: "good",
    when: (s) => s.economyType === "refinery"
  },
  {
    id: "resortSeason",
    weight: 3,
    tone: "good",
    when: (s) => s.economyType === "resort"
  },
  {
    id: "resortCelebrity",
    weight: 3,
    tone: "good",
    when: (s) => s.economyType === "resort"
  },
  {
    id: "factoryQuota",
    weight: 3,
    tone: "good",
    when: (s) => s.economyType === "industrial"
  },
  {
    id: "factoryRobots",
    weight: 3,
    tone: "neutral",
    when: (s) => s.economyType === "industrial"
  },
  {
    id: "harvestBumper",
    weight: 4,
    tone: "good",
    when: (s) => s.economyType === "agricultural" && s.status === "uneventful"
  },
  {
    id: "hiTechLaunch",
    weight: 3,
    tone: "good",
    when: (s) => s.economyType === "hiTech"
  },
  {
    id: "patentAuction",
    weight: 3,
    tone: "good",
    when: (s) => s.economyType === "hiTech"
  },
  {
    id: "miningCollapse",
    weight: 3,
    tone: "bad",
    when: (s) => s.economyType === "mining"
  },
  {
    id: "industrialSmog",
    weight: 3,
    tone: "bad",
    when: (s) => s.economyType === "industrial"
  },
  {
    id: "resortOffSeason",
    weight: 2,
    tone: "neutral",
    when: (s) => s.economyType === "resort"
  },
  {
    id: "agriMarketDay",
    weight: 3,
    tone: "neutral",
    when: (s) => s.economyType === "agricultural"
  },
  {
    id: "refineryTankerQueue",
    weight: 3,
    tone: "neutral",
    when: (s) => s.economyType === "refinery"
  },
  // --- Local oddities ---------------------------------------------------------
  {
    id: "gemRush",
    weight: 4,
    tone: "good",
    when: (s) => s.specialResource === "mineralRich"
  },
  {
    id: "mineralSurvey",
    weight: 3,
    tone: "neutral",
    when: (s) => s.specialResource === "mineralRich"
  },
  {
    id: "mushroomBloom",
    weight: 4,
    tone: "neutral",
    when: (s) => s.specialResource === "weirdMushrooms"
  },
  {
    id: "mushroomCuisine",
    weight: 3,
    tone: "good",
    when: (s) => s.specialResource === "weirdMushrooms"
  },
  {
    id: "herbHarvest",
    weight: 4,
    tone: "good",
    when: (s) => s.specialResource === "lotsOfHerbs"
  },
  {
    id: "herbClinic",
    weight: 3,
    tone: "good",
    when: (s) => s.specialResource === "lotsOfHerbs"
  },
  {
    id: "artFestival",
    weight: 4,
    tone: "good",
    when: (s) => s.specialResource === "artistic"
  },
  {
    id: "hologramAuction",
    weight: 3,
    tone: "neutral",
    when: (s) => s.specialResource === "artistic"
  },
  {
    id: "warGames",
    weight: 4,
    tone: "neutral",
    when: (s) => s.specialResource === "warlike"
  },
  {
    id: "springBottling",
    weight: 4,
    tone: "good",
    when: (s) => s.specialResource === "sweetwater"
  },
  {
    id: "waterExport",
    weight: 3,
    tone: "good",
    when: (s) => s.specialResource === "sweetwater"
  },
  {
    id: "dustStorm",
    weight: 4,
    tone: "bad",
    when: (s) => s.specialResource === "desert"
  },
  {
    id: "desertSolarFarm",
    weight: 3,
    tone: "good",
    when: (s) => s.specialResource === "desert"
  },
  {
    id: "warlikeArmourers",
    weight: 3,
    tone: "neutral",
    when: (s) => s.specialResource === "warlike"
  },
  // Worlds whose oddity had no story of its own until now: they were falling
  // back on the generic pool and reading like anywhere else.
  {
    id: "faunaSafari",
    weight: 4,
    tone: "good",
    when: (s) => s.specialResource === "richFauna"
  },
  {
    id: "faunaPoachers",
    weight: 3,
    tone: "bad",
    when: (s) => s.specialResource === "richFauna"
  },
  {
    id: "lifelessDome",
    weight: 4,
    tone: "neutral",
    when: (s) => s.specialResource === "lifeless"
  },
  {
    id: "richSoilFair",
    weight: 4,
    tone: "good",
    when: (s) => s.specialResource === "richSoil"
  },
  {
    id: "poorSoilHydroponics",
    weight: 4,
    tone: "neutral",
    when: (s) => s.specialResource === "poorSoil"
  },
  {
    id: "mineralPoorImports",
    weight: 4,
    tone: "bad",
    when: (s) => s.specialResource === "mineralPoor"
  },
  // --- Anywhere ---------------------------------------------------------------
  {
    id: "pirateSighting",
    weight: 3,
    tone: "bad",
    when: (s) => POLITICS[s.politics].strengthPirates >= 5
  },
  {
    id: "patrolCrackdown",
    weight: 3,
    tone: "neutral",
    when: (s) => POLITICS[s.politics].strengthPolice >= 5
  },
  {
    id: "traderInflux",
    weight: 3,
    tone: "good",
    when: (s) => POLITICS[s.politics].strengthTraders >= 5
  },
  {
    id: "stationTraffic",
    weight: 3,
    tone: "neutral",
    when: (s) => (s.bodies ?? []).some((b) => b.kind === "station")
  },
  { id: "dockStrike", weight: 2, tone: "bad", when: () => true },
  { id: "portFeeRise", weight: 2, tone: "bad", when: () => true },
  { id: "salvageAuction", weight: 2, tone: "neutral", when: () => true },
  { id: "beaconOffline", weight: 2, tone: "bad", when: () => true },
  { id: "insuranceRates", weight: 2, tone: "neutral", when: () => true },
  { id: "quietWeek", weight: 2, tone: "neutral", when: (s) => s.status === "uneventful" },
  { id: "harbourFestival", weight: 2, tone: "good", when: (s) => s.status === "uneventful" }
];
var NEWS_IDS = TEMPLATES.map((t) => t.id);
var NEWS_MIN = 2;
var NEWS_MAX = 4;
function toItem(template) {
  return {
    id: template.id,
    headlineKey: `news.${template.id}.headline`,
    bodyKey: `news.${template.id}.body`,
    tone: template.tone
  };
}
function drawOne(pool, rng) {
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, t) => sum + t.weight, 0);
  let roll = rng.int(0, total - 1);
  for (let i = 0; i < pool.length; i++) {
    if (roll < pool[i].weight) return pool.splice(i, 1)[0];
    roll -= pool[i].weight;
  }
  return pool.splice(pool.length - 1, 1)[0];
}
function generateNews(sys, rng) {
  const applicable = TEMPLATES.filter((t) => t.when(sys));
  const crisis = applicable.filter((t) => t.crisis);
  const rest = applicable.filter((t) => !t.crisis);
  const items = [];
  const lead = drawOne(crisis, rng);
  if (lead) items.push(toItem(lead));
  if (crisis.length > 0 && rng.chance(0.5)) {
    const second = drawOne(crisis, rng);
    if (second) items.push(toItem(second));
  }
  const want = rng.int(NEWS_MIN, NEWS_MAX);
  while (items.length < want) {
    const next = drawOne(rest, rng);
    if (!next) break;
    items.push(toItem(next));
  }
  return items;
}
function systemNews(sys) {
  return sys?.news ?? [];
}

// src/game/engine/warp.ts
function encounterRolls(distance2) {
  return Math.max(1, Math.min(3, 1 + Math.floor(distance2 / 6)));
}
var BLACK_HOLE_CHANCE = 0.02;
var BLACK_HOLE_CHANCE_PER_PARSEC = 15e-4;
var BLACK_HOLE_CHANCE_MAX = 0.06;
function blackHoleEscapeChance(state) {
  const skills = effectiveSkills(state);
  const hullFraction = maxHull(state.ship) > 0 ? state.ship.hull / maxHull(state.ship) : 0;
  const shielded = state.ship.shieldPoints.some((p) => p > 0) ? 0.08 : 0;
  const explorer = SHIP_TYPES[state.ship.type].shipClass === "explorer" ? 0.12 : 0;
  const raw = 0.3 + skills.pilot * 0.045 + hullFraction * 0.15 + shielded + explorer;
  return Math.max(0.1, Math.min(0.95, raw));
}
function blackHoleChance(distance2) {
  return Math.min(
    BLACK_HOLE_CHANCE_MAX,
    BLACK_HOLE_CHANCE + Math.max(0, distance2) * BLACK_HOLE_CHANCE_PER_PARSEC
  );
}
function resolveBlackHole(state, rng) {
  const escapeChance = blackHoleEscapeChance(state);
  const survived = rng.chance(escapeChance);
  const daysLost = rng.int(1, 4);
  for (let i = 0; i < daysLost; i++) advanceDay(state);
  if (!survived) {
    const damage2 = state.ship.hull;
    state.ship.hull = 0;
    state.ship.shieldPoints = state.ship.shieldPoints.map(() => 0);
    pushLog(state, "event.blackHole.logLost");
    return { survived: false, damage: damage2, daysLost, escapeChance };
  }
  const stress = rng.int(5, Math.max(6, Math.round(maxHull(state.ship) * 0.35)));
  const damage = Math.min(state.ship.hull - 1, stress);
  if (damage > 0) state.ship.hull -= damage;
  state.ship.shieldPoints = state.ship.shieldPoints.map(() => 0);
  pushLog(state, "event.blackHole.logSurvived", { dmg: Math.max(0, damage), days: daysLost });
  return { survived: true, damage: Math.max(0, damage), daysLost, escapeChance };
}
function blackHoleEvent(bh, escapedByPod = false) {
  const bodyKey = bh.survived ? "event.blackHole.bodySurvived" : escapedByPod ? "event.blackHole.bodyPod" : "event.blackHole.bodyLost";
  return {
    id: "blackHole",
    titleKey: "event.blackHole.title",
    bodyKey,
    params: {
      dmg: bh.damage,
      days: bh.daysLost,
      chance: Math.round(bh.escapeChance * 100)
    }
  };
}
function settleArrival(state, rng) {
  const target = state.systems[state.currentSystem];
  target.visited = true;
  state.currentBody = 0;
  clearLocalSourcing(state);
  state.ship.shieldPoints = state.ship.shields.map((s) => SHIELDS[s].power);
  refreshMarket(target, rng);
  if (state.autoRefuel) {
    const res = refuelFull(state);
    if (res.ok && res.info) pushLog(state, "log.autoRefuel", res.info.params);
  }
  target.questBoard = generateQuestBoard(state, rng);
  target.mercenaryIds = generateCrewRoster(state, rng);
  target.news = generateNews(target, rng);
}
function flyTo(state, targetId, distance2, rng) {
  const target = state.systems[targetId];
  state.currentSystem = targetId;
  const incident = advanceDay(state, rng);
  const encounters = [];
  const rolls = encounterRolls(distance2);
  for (let i = 0; i < rolls; i++) {
    const rolled = rollEncounter(state, rng);
    if (rolled) encounters.push(rolled);
  }
  const bounty = hasActiveBounty(state);
  if (bounty && bounty.bountyName) {
    const pirate = encounters.find((e) => e.kind === "pirate");
    if (pirate) {
      pirate.bountyQuestId = bounty.id;
      pirate.bountyName = bounty.bountyName;
      pirate.messages = [{ key: "encounter.bounty.appear", params: { bounty: bounty.bountyName } }];
    } else if (encounters.length === 0 && rng.chance(0.35)) {
      encounters.push(createBountyEncounter(state, bounty.id, bounty.bountyName, rng));
    }
  }
  const blackHole = rng.chance(blackHoleChance(distance2)) ? resolveBlackHole(state, rng) : null;
  settleArrival(state, rng);
  pushLog(state, "log.arrived", { system: target.nameId, distance: distance2 });
  const questsReady = questsReadyToTurnIn(state);
  const quiet = encounters.length === 0 && !blackHole;
  const event = quiet ? maybeTriggerEvent(state, rng) : null;
  const questOffer = quiet && !event ? generateQuestOffer(state, rng) : null;
  return {
    ok: true,
    encounters,
    event,
    questOffer,
    questsReady,
    incident,
    blackHole,
    arrivedAt: targetId
  };
}
function warp(state, targetId) {
  const here = state.systems[state.currentSystem];
  const target = state.systems[targetId];
  if (!target || targetId === state.currentSystem) return { ok: false, error: "error.invalidTarget" };
  const viaWormhole = here.wormholeTo === targetId;
  const cost = fuelCost(state, targetId);
  if (!viaWormhole && cost > state.ship.fuel) return { ok: false, error: "error.notEnoughFuel" };
  const rng = new Rng((state.seed ^ state.day * 2654435761) >>> 0);
  if (viaWormhole) {
    const tax = wormholeTax(state);
    if (state.credits < tax) return { ok: false, error: "error.cannotAffordWormhole" };
    state.credits -= tax;
    pushLog(state, "log.wormhole", { system: target.nameId, tax });
  } else {
    state.ship.fuel -= cost;
  }
  return flyTo(state, targetId, viaWormhole ? 0 : systemDistance(here, target), rng);
}
function enterUnstableWormhole(state) {
  const here = state.systems[state.currentSystem];
  if (!here?.unstableWormhole) return { ok: false, error: "error.noWormholeHere" };
  const elsewhere = state.systems.filter((s) => s.id !== here.id);
  if (elsewhere.length === 0) return { ok: false, error: "error.invalidTarget" };
  const rng = new Rng((state.seed ^ state.day * 40503 ^ here.id * 2654435761) >>> 0);
  const target = rng.pick(elsewhere);
  pushLog(state, "log.unstableWormhole", { system: target.nameId });
  return flyTo(state, target.id, 0, rng);
}
function wormholeTax(state) {
  return Math.round(SHIP_TYPES[state.ship.type].price * 0.02);
}

// src/game/engine/system.ts
var IN_SYSTEM_ENCOUNTER_CHANCE = 0.12;
function bodyTravelProblem(state, bodyId) {
  const bodies = systemBodies(state.systems[state.currentSystem]);
  if (!bodies[bodyId]) return "error.invalidTarget";
  if (bodyId === currentBodyIndex(state)) return "error.alreadyHere";
  return null;
}
function travelToBody(state, bodyId, rng) {
  const problem = bodyTravelProblem(state, bodyId);
  if (problem) return { ok: false, error: problem };
  const bodies = systemBodies(state.systems[state.currentSystem]);
  const from = bodies[currentBodyIndex(state)];
  const to = bodies[bodyId];
  const days = bodyTransitDays(from, to);
  let incident = null;
  const encounters = [];
  for (let day = 0; day < days; day++) {
    const dayIncident = advanceDay(state, rng);
    if (dayIncident && !incident) incident = dayIncident;
    if (rng.chance(IN_SYSTEM_ENCOUNTER_CHANCE)) {
      const met = rollEncounter(state, rng);
      if (met) encounters.push(met);
    }
  }
  state.currentBody = bodyId;
  state.ship.shieldPoints = state.ship.shields.map((s) => SHIELDS[s].power);
  pushLog(state, "log.arrivedBody", { days });
  return { ok: true, arrivedAt: bodyId, days, encounters, incident };
}

// src/game/engine/mining.ts
function mineOnce(state, rng) {
  const site = currentMineSite(state);
  if (!site) return { ok: false, error: "error.noMineSite" };
  if (site.resource === "fuel") {
    if (state.ship.fuel >= maxFuel(state.ship)) return { ok: false, error: "error.tankFull" };
  } else if (freeCargoBays(state.ship) <= 0) {
    return { ok: false, error: "error.holdFull" };
  }
  const incident = advanceDay(state, rng);
  const yieldPerDay = SHIP_TYPES[state.ship.type].shipClass === "industrial" ? INDUSTRIAL_MINING_YIELD : 1;
  let bonus;
  let amount;
  if (site.resource === "fuel") {
    const cap = maxFuel(state.ship);
    amount = Math.min(yieldPerDay, cap - state.ship.fuel);
    state.ship.fuel += amount;
    pushLog(state, "log.minedFuel", { amount });
  } else {
    amount = Math.min(yieldPerDay, freeCargoBays(state.ship));
    state.ship.cargo[site.resource] += amount;
    if (atCapital(state)) noteLocalSourcing(state, site.resource, amount);
    pushLog(state, "log.mined", { good: site.resource, amount });
    if (site.kind === "asteroidField" && freeCargoBays(state.ship) > 0 && rng.chance(0.05 + site.richness * 4e-3)) {
      state.ship.cargo.gems += 1;
      if (atCapital(state)) noteLocalSourcing(state, "gems", 1);
      bonus = "gems";
      pushLog(state, "log.minedBonus", { good: "gems" });
    }
  }
  const encounter = rng.chance(pirateEncounterChance(state, 0.12)) ? spawnPirates(state, rng) : null;
  return { ok: true, resource: site.resource, amount, bonus, encounter, incident };
}

// src/game/engine/escort.ts
var ESCORT_MIN_LEGS = 3;
var ESCORT_MAX_LEGS = 8;
var ESCORT_KILL_BONUS = 250;
function escortLegs(state, quest) {
  const from = state.systems[quest.giverSystem];
  const to = state.systems[quest.targetSystem];
  if (!from || !to) return ESCORT_MIN_LEGS;
  const dist = systemDistance(from, to);
  return Math.max(ESCORT_MIN_LEGS, Math.min(ESCORT_MAX_LEGS, Math.round(dist / 3) + ESCORT_MIN_LEGS));
}
function rollContact(state, rng) {
  if (!rng.chance(0.55)) return null;
  const roll = rng.next();
  if (roll < 0.6) return "pirate";
  if (roll < 0.7) return "alien";
  if (roll < 0.82) return "police";
  if (roll < 0.92 && notoriety(state) > 0) return "bountyHunter";
  return "trader";
}
function orderFor(kind) {
  if (kind === "pirate" || kind === "alien" || kind === "bountyHunter") return "engage";
  if (kind === "police") return "standDown";
  return "holdFire";
}
function fightItOut(state, enc, rng) {
  let guard = 0;
  while (guard++ < 200) {
    if (enc.status === "ongoing") {
      resolveRound(state, enc, "attack", rng);
      continue;
    }
    if (enc.status === "oppSurrendered") {
      plunder(state, enc);
      continue;
    }
    break;
  }
}
function runEscort(state, questId, rng) {
  const quest = state.quests.find(
    (q) => q.id === questId && q.status === "active" && q.type === "escort"
  );
  if (!quest) return { ok: false, error: "error.questGone" };
  if (state.currentSystem !== quest.giverSystem || !atCapital(state)) {
    return { ok: false, error: "error.escortNotHere" };
  }
  const problem = escortShipProblem(state);
  if (problem) return { ok: false, error: problem };
  const total = escortLegs(state, quest);
  const legs = [];
  let kills = 0;
  let damageTaken = 0;
  let destroyed = false;
  for (let i = 1; i <= total; i++) {
    advanceDay(state);
    const leg = { index: i, messages: [], damage: 0, kills: 0 };
    const hullBefore = state.ship.hull;
    const kind = rollContact(state, rng);
    if (!kind) {
      leg.messages.push({ key: "escort.legQuiet", params: { leg: i } });
    } else {
      const order = orderFor(kind);
      leg.kind = kind;
      leg.order = order;
      leg.messages.push({ key: "escort.contact", params: { leg: i, kind: `encounter.kind.${kind}` } });
      leg.messages.push({ key: `escort.order.${order}` });
      if (order === "engage") {
        const enc = spawnEncounter(kind, state, rng);
        fightItOut(state, enc, rng);
        leg.messages.push(...enc.messages);
        leg.kills = enc.defeated;
        kills += enc.defeated;
        if (enc.status === "playerDestroyed") destroyed = true;
      }
    }
    leg.damage = Math.max(0, hullBefore - state.ship.hull);
    damageTaken += leg.damage;
    legs.push(leg);
    if (destroyed) {
      leg.messages.push({ key: "escort.lost" });
      break;
    }
    if (i < total && state.ship.shields.length > 0) {
      const charged = state.ship.shieldPoints.some((p, idx) => p < SHIELDS[state.ship.shields[idx]].power);
      state.ship.shieldPoints = state.ship.shields.map((s) => SHIELDS[s].power);
      if (charged) leg.messages.push({ key: "escort.shieldsRecharged" });
    }
  }
  const run = {
    questId,
    targetSystem: quest.targetSystem,
    legs,
    kills,
    damageTaken,
    destroyed,
    reward: quest.reward,
    dangerPay: destroyed ? 0 : kills * ESCORT_KILL_BONUS
  };
  if (destroyed) {
    pushLog(state, "escort.failed", { system: state.systems[quest.targetSystem]?.nameId ?? "" });
    return { ok: true, run };
  }
  state.currentSystem = quest.targetSystem;
  settleArrival(state, rng);
  completeEscort(state, questId, run.dangerPay);
  legs[legs.length - 1]?.messages.push({
    key: "escort.arrived",
    params: { system: state.systems[quest.targetSystem]?.nameId ?? "" }
  });
  return { ok: true, run };
}
export {
  BANK_BOUNTY_DEBT,
  BLACK_HOLE_CHANCE,
  BLACK_HOLE_CHANCE_MAX,
  BLACK_HOLE_CHANCE_PER_PARSEC,
  BOUNTY_NAMES,
  CREW_ROLES,
  CREW_TABLE,
  CRIT_MULTIPLIER,
  DOUBLE_DUTY_PENALTY,
  ECONOMIES,
  ECONOMY_IDS,
  ESCAPE_POD_PRICE,
  ESCORT_KILL_BONUS,
  ESCORT_MAX_LEGS,
  ESCORT_MIN_LEGS,
  ESCORT_MIN_SHIELDS,
  ESCORT_MIN_WEAPONS,
  EXPLORER_RANGE_BONUS,
  EXTRA_CARGO_BAYS,
  EXTRA_CARGO_BAYS_ADVANCED,
  EXTRA_FUEL_TANKS,
  EXTRA_FUEL_TANKS_ADVANCED,
  FINE_BASE,
  FINE_PER_NOTORIETY,
  GADGETS,
  GADGET_IDS,
  GALAXY_HEIGHT,
  GALAXY_WIDTH,
  GAME_VERSION,
  GOOD_IDS,
  HULL_UPGRADE_AMOUNT,
  INCIDENT_BASE_RISK,
  INCIDENT_OVERLOAD_RISK,
  INDUSTRIAL_MINING_YIELD,
  IN_SYSTEM_ENCOUNTER_CHANCE,
  MAX_ACTIVE_QUESTS,
  MAX_ENGAGEMENT_RANGE,
  MAX_HULL_UPGRADES,
  MAX_SKILL,
  MAX_SYSTEM_BODIES,
  MERCENARIES,
  MERCENARY_IDS,
  MILITARY_WEAPON_BONUS,
  MIN_SYSTEM_DISTANCE,
  NEWS_IDS,
  NEWS_MAX,
  NEWS_MIN,
  PASSENGER_NAMES,
  PIRACY_KARMA,
  PLANET_MAX_HULL_UPGRADES,
  POINT_BLANK_RANGE,
  POLITICS,
  POLITICS_IDS,
  PRISON_FINE_BASE,
  PRISON_FINE_PER_NOTORIETY,
  PROFESSIONS,
  QUEST_KARMA,
  RANGE_ACCURACY_PENALTY,
  RANGE_MANOEUVRE_STEP,
  ROBOTS,
  ROBOT_FUEL_PER_DAY,
  ROBOT_IDS,
  ROLE_SKILL,
  Rng,
  SENTENCE_BASE_DAYS,
  SENTENCE_DAYS_PER_NOTORIETY,
  SHIELDS,
  SHIELD_IDS,
  SHIP_CLASSES,
  SHIP_SIZES,
  SHIP_TYPES,
  SHIP_TYPE_IDS,
  SIZE_RANK,
  SLOT_TABLE,
  SPECIAL_GOOD_IDS,
  STANDING_IDS,
  STARTING_CREDITS,
  STATIONS,
  STATION_IDS,
  STATION_KINDS,
  SYSTEM_COUNT,
  TECH_LEVELS,
  TECH_LEVEL_IDS,
  TRACTOR_ACCURACY_BONUS,
  TRADE_GOODS,
  UNSTABLE_WORMHOLES,
  WANTED_THRESHOLD,
  WEAPONS,
  WEAPON_IDS,
  WORMHOLE_PAIRS,
  abandonQuest,
  acceptBoardQuest,
  acceptQuest,
  activeQuests,
  advanceDay,
  applyKarma,
  assignRoles,
  atCapital,
  battleStations,
  berthsUsed,
  blackHoleChance,
  blackHoleEscapeChance,
  blackHoleEvent,
  boardQuestProblem,
  bodyMineSite,
  bodyTransitDays,
  bodyTravelProblem,
  buyEscapePod,
  buyGadget,
  buyGood,
  buyHullUpgrade,
  buyInsurance,
  buyQuestSupplies,
  buyRobot,
  buyShield,
  buyShip,
  buyWeapon,
  buyableGoods,
  canEscort,
  canTravelTo,
  canTurnIn,
  cancelInsurance,
  clearLocalSourcing,
  completeBounty,
  completeEscort,
  createBountyEncounter,
  crewCount,
  crewFor,
  crewHands,
  crewLoad,
  crewRepairPerDay,
  crewRoster,
  crewShortfall,
  crewWages,
  currentBody,
  currentBodyIndex,
  currentMineSite,
  currentShieldCharge,
  currentStation,
  currentSystem,
  deliverableUnits,
  distance,
  dumpGood,
  economyOf,
  effectiveSkills,
  emptyGoods,
  encounterRolls,
  ensureBodies,
  enterUnstableWormhole,
  escortLegs,
  escortShipProblem,
  fineToClear,
  fireMercenary,
  fleeChance,
  freeCargoBays,
  freeQuarters,
  fuelCost,
  fuelPricePerParsec,
  gadgetsForSale,
  generateBodies,
  generateCrewRoster,
  generateGalaxy,
  generateNews,
  generateQuestBoard,
  generateQuestOffer,
  getLoan,
  hasActiveBounty,
  hasShipyard,
  hasSpaceport,
  hireMercenary,
  hullUpgradePrice,
  hunterChance,
  hunterEmployer,
  isContractEmbargoed,
  isPeacefulTrader,
  isSpecialGood,
  marketBuyPrice,
  maxFuel,
  maxHull,
  maxHullUpgradesHere,
  maxLoan,
  maxRange,
  maybeTriggerEvent,
  mercenaryWorth,
  minCrew,
  mineOnce,
  newGame,
  noteLocalSourcing,
  notoriety,
  opponentHitChance,
  payDebt,
  payFine,
  pirateCargoChance,
  pirateCargoValue,
  pirateEncounterChance,
  playerHitChance,
  plunder,
  pushLog,
  questDeliverableMissing,
  questDemand,
  questParams,
  questSupply,
  questSupplyMissing,
  questSupplyUnitPrice,
  questsReadyToTurnIn,
  randomSeed,
  reachableSystems,
  recommendedCrew,
  refreshMarket,
  refuel,
  refuelFull,
  releaseLocalSourcing,
  repair,
  repairCostMulHere,
  repairFull,
  repairPricePerUnit,
  reportPiracy,
  resolveRound,
  robotsForSale,
  robotsPowered,
  roleRisk,
  roleStrength,
  rollCrewIncident,
  rollEncounter,
  runEscort,
  sellGadget,
  sellGood,
  sellRobot,
  sellShield,
  sellWeapon,
  sentenceDays,
  serveSentence,
  setTarget,
  settleArrival,
  shieldsForSale,
  shipRobots,
  shipValue,
  shipsForSale,
  sizeRank,
  slotsFor,
  spawnEncounter,
  spawnPirates,
  standardPrice,
  standing,
  systemBodies,
  systemDistance,
  systemNews,
  totalCargoBays,
  totalShieldPower,
  tractorChance,
  tradeBuy,
  tradeSell,
  traderDiscount,
  transitDaysTo,
  travelToBody,
  turnInQuest,
  usedCargoBays,
  wantedByBank,
  wantedByLaw,
  warp,
  weaponPower,
  weaponsForSale,
  wormholeTax
};
