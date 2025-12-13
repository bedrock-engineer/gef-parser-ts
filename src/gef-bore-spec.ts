import { StandardizedCode } from "./gef-bore.js";
import {
  heightDeterminationCodes,
  placeDeterminationCodes,
} from "./location-codes.js";

// Specimen codes based on GEF-BORE specification
export const SPECIMEN_CODES: {
  geroerd: ReadonlyArray<SpecimenCode>;
  monstersteekapparaat: ReadonlyArray<SpecimenCode>;
  dikDunwandig: ReadonlyArray<SpecimenCode>;
  monstermethode: ReadonlyArray<SpecimenCode>;
} = {
  geroerd: [
    { code: "G", nl: "Geroerd", en: "Disturbed" },
    { code: "O", nl: "Ongeroerd", en: "Undisturbed" },
  ],
  monstersteekapparaat: [
    { code: "AMS", nl: "Ackermann-apparaat", en: "Ackermann apparatus" },
    {
      code: "BMS",
      nl: "Begemann-continu-monstersteekapparaat",
      en: "Begemann continuous sampler",
    },
    { code: "DMS", nl: "Druksteekapparaat", en: "Push sampler" },
    { code: "ZMS", nl: "Zuiger-monstersteekapparaat", en: "Piston sampler" },
    { code: "OMS", nl: "Open monstersteekapparaat", en: "Open tube sampler" },
    { code: "SMS", nl: "Monstersteekapparaat SPT", en: "SPT sampler" },
  ],
  dikDunwandig: [
    { code: "DIK", nl: "Dikwandig", en: "Thick-walled" },
    { code: "DUN", nl: "Dunwandig", en: "Thin-walled" },
  ],
  monstermethode: [
    { code: "D", nl: "Drukken", en: "Pushed/Static" },
    { code: "H", nl: "Hameren", en: "Hammered/Dynamic" },
  ],
}; // Drilling method codes from NEN 5104
const DRILLING_METHOD_CODES = {
  ACK: "Ackermann-steekboring",
  AVE: "Avegaarboring",
  AVH: "Holle avegaarboring",
  AVS: "Avegaar-steekboring",
  BES: "Begemann-steekboring",
  BEI: "Beitel",
  BSA: "Beeker-sampler",
  BEV: "Bevriezen",
  CFL: "Counter-flushboring",
  DRC: "Dropcorer",
  EDM: "Edelmanboring",
  GD1: "Geodoff 1 boring",
  GD2: "Geodoff 2 boring",
  GD3: "Geodoff 3 boring",
  GUT: "Guts",
  GRA: "Graven",
  HAH: "Hamon happer",
  HAN: "Handboring",
  HAP: "Hapmonster",
  KER: "Kernboring",
  LEP: "Lepelboring",
  LUC: "Luchtliftboring",
  LUH: "Luchthamer",
  ONT: "Ontsluiting",
  OSC: "Oscorer",
  PIS: "Pistoncorer",
  PUL: "Pulsboring",
  PUH: "Handpuls",
  PUK: "Pulsboring (lichte stelling)",
  PUM: "Pulsboring (mechanisch)",
  RAM: "Ramguts",
  RFL: "Ro-flushboring",
  RIV: "Riverside boring",
  SFC: "Straight-flushboring met core sampling",
  SFL: "Straight-flushboring",
  SLB: "Slibsteker",
  SPI: "Spiraalboring",
  SPO: "Spoelboring",
  SPS: "Spoelboring met steekmonsters",
  SPU: "Spuitboring",
  STE: "Steekboring",
  TRF: "Trilflipboring",
  TRI: "Trilboring",
  VDS: "Van der Staay boring",
  VVH: "Van Veen happer",
  VIB: "Vibrocorer",
  ZEN: "Zenkovitchboring",
  ZUI: "Zuigboring",
} as const;
const drillingMethods = Object.entries(DRILLING_METHOD_CODES).map(
  ([code, description]) => ({
    code,
    description, // TODO: actually English translation
    descriptionNl: description,
  }),
);
export const boreMeasurementTextVariables: Record<
  number,
  BoreMeasurementTextVariable
> = {
  1: {
    description: "Opdrachtgever",
    category: "project_info",
    required: false,
    standardizedCodes: null,
  },

  2: {
    description: "Doel onderzoek",
    category: "project_info",
    required: false,
    standardizedCodes: null,
  },

  3: {
    description: "Plaats uitvoering",
    category: "location",
    required: true,
    standardizedCodes: null,
  },

  4: {
    description: "Boring volgens NEN5119 uitgevoerd",
    category: "project_info",
    required: false,
    standardizedCodes: null,
  },

  5: {
    description: "Datum boorbeschrijving",
    category: "project_info",
    required: true,
    standardizedCodes: null,
  },

  6: {
    description: "Beschrijver lagen",
    category: "personnel",
    required: true,
    standardizedCodes: null,
  },

  9: {
    description: "Locaal referentiesysteem",
    category: "reference_system",
    required: true,
    standardizedCodes: null,
  },

  11: {
    description: "Methode maaiveldhoogtebepaling",
    category: "elevation_determination",
    required: false,
    standardizedCodes: heightDeterminationCodes,
  },

  12: {
    description: "Methode plaatsbepaling",
    category: "position_determination",
    required: false,
    standardizedCodes: placeDeterminationCodes,
  },

  13: {
    description: "Boorfirma",
    category: "personnel",
    required: true,
    standardizedCodes: null,
  },

  14: {
    description: "Vertrouwelijkheid boorbeschrijving",
    category: "data_management",
    required: false,

    standardizedCodes: [
      {
        code: "Ja",
        descriptionNl: "vertrouwelijk",
        description: "confidential",
      },
      { code: "Nee", descriptionNl: "openbaar", description: "public" },
    ],
  },

  15: {
    description: "Einddatum geheimhouding",
    category: "data_management",
    required: false,
    standardizedCodes: null,
  },

  16: {
    description: "Datum boring",
    category: "project_info",
    required: true,
    standardizedCodes: null,
  },

  17: {
    description: "Vochtigheidstoestand beschreven grond",
    category: "sample_condition",
    required: false,

    standardizedCodes: [
      { code: "droog", descriptionNl: "droge grond", description: "dry soil" },
      {
        code: "nat",
        descriptionNl: "veldvochtige grond",
        description: "field-moist soil",
      },
    ],
  },

  18: {
    description: "Aanwezigheid peilbuis",
    category: "monitoring_wells",
    required: false,

    standardizedCodes: [
      {
        code: "Ja",
        descriptionNl: "peilbuis aanwezig",
        description: "monitoring well present",
      },
      {
        code: "Nee",
        descriptionNl: "peilbuis afwezig",
        description: "monitoring well absent",
      },
    ],
  },

  19: {
    description: "Einddatum boring",
    category: "project_info",
    required: false,
    standardizedCodes: null,
  },

  20: {
    description: "Koppeling met sondering",
    category: "related_investigations",
    required: false,
    standardizedCodes: null,
  },

  21: {
    description: "Gebruik boor- en steunvloeistof",
    category: "drilling_methods",
    required: false,
    standardizedCodes: null,
  },

  22: {
    description: "Omschrijving boor- en steunvloeistof",
    category: "drilling_methods",
    required: false,
    standardizedCodes: null,
  },

  23: {
    description: "Boormeester",
    category: "personnel",
    required: false,
    standardizedCodes: null,
  },

  31: {
    description: "Boormethode boortraject 1",
    category: "drilling_methods",
    required: true,
    standardizedCodes: drillingMethods,
  },

  32: {
    description: "Boormethode boortraject 2",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  33: {
    description: "Boormethode boortraject 3",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  34: {
    description: "Boormethode boortraject 4",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  35: {
    description: "Boormethode boortraject 5",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  36: {
    description: "Boormethode boortraject 6",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  37: {
    description: "Boormethode boortraject 7",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  38: {
    description: "Boormethode boortraject 8",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  39: {
    description: "Boormethode boortraject 9",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },

  40: {
    description: "Boormethode boortraject 10",
    category: "drilling_methods",
    required: false,
    standardizedCodes: drillingMethods,
  },
};
export interface BoreMeasurementTextVariable {
  description: string;
  category: string;
  required: boolean;
  standardizedCodes: Array<StandardizedCode> | null;
}
export const boreMeasurementVariables: Record<number, BoreMeasurementVariable> =
  {
    13: {
      unit: "m",
      description: "Voorgegraven diepte",
      category: "borehole_geometry",
      dataType: "float",
    },

    14: {
      unit: "m",
      description: "GHG (gemiddeld hoogste grondwaterstand)",
      category: "groundwater",
      dataType: "float",
    },

    15: {
      unit: "m",
      description: "GLG (gemiddeld laagste grondwaterstand)",
      category: "groundwater",
      dataType: "float",
    },

    16: {
      unit: "m",
      description: "Einddiepte",
      category: "borehole_geometry",
      dataType: "float",
    },

    17: {
      unit: "l",
      description: "Verbruik boor- en steunvloeistof",
      category: "drilling_equipment",
      dataType: "float",
    },

    18: {
      unit: "m",
      description: "Grondwaterstand tijdens boren",
      category: "groundwater",
      dataType: "float",
    },

    19: {
      unit: "-",
      description: "Aantal peilbuizen",
      category: "monitoring_wells",
      dataType: "integer",
    },

    31: {
      unit: "m",
      description: "Diepte onderkant boortraject 1",
      category: "drilling_segments",
      dataType: "float",
    },

    33: {
      unit: "m",
      description: "Diepte onderkant boortraject 2",
      category: "drilling_segments",
      dataType: "float",
    },

    35: {
      unit: "m",
      description: "Diepte onderkant boortraject 3",
      category: "drilling_segments",
      dataType: "float",
    },

    37: {
      unit: "m",
      description: "Diepte onderkant boortraject 4",
      category: "drilling_segments",
      dataType: "float",
    },

    39: {
      unit: "m",
      description: "Diepte onderkant boortraject 5",
      category: "drilling_segments",
      dataType: "float",
    },

    41: {
      unit: "m",
      description: "Diepte onderkant boortraject 6",
      category: "drilling_segments",
      dataType: "float",
    },

    43: {
      unit: "m",
      description: "Diepte onderkant boortraject 7",
      category: "drilling_segments",
      dataType: "float",
    },

    45: {
      unit: "m",
      description: "Diepte onderkant boortraject 8",
      category: "drilling_segments",
      dataType: "float",
    },

    47: {
      unit: "m",
      description: "Diepte onderkant boortraject 9",
      category: "drilling_segments",
      dataType: "float",
    },

    49: {
      unit: "m",
      description: "Diepte onderkant boortraject 10",
      category: "drilling_segments",
      dataType: "float",
    },

    32: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 1",
      category: "drilling_equipment",
      dataType: "float",
    },

    34: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 2",
      category: "drilling_equipment",
      dataType: "float",
    },

    36: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 3",
      category: "drilling_equipment",
      dataType: "float",
    },

    38: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 4",
      category: "drilling_equipment",
      dataType: "float",
    },

    40: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 5",
      category: "drilling_equipment",
      dataType: "float",
    },

    42: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 6",
      category: "drilling_equipment",
      dataType: "float",
    },

    44: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 7",
      category: "drilling_equipment",
      dataType: "float",
    },

    46: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 8",
      category: "drilling_equipment",
      dataType: "float",
    },

    48: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 9",
      category: "drilling_equipment",
      dataType: "float",
    },

    50: {
      unit: "mm",
      description: "Boorbuisdiameter boortraject 10",
      category: "drilling_equipment",
      dataType: "float",
    },
  };
export interface BoreMeasurementVariable {
  unit: string;
  description: string;
  category: string;
  dataType: string;
}
export const SOIL_TYPE_NAMES: Record<string, string> = {
  G: "Grind",
  Z: "Zand",
  L: "Leem",
  K: "Klei",
  V: "Veen",
  NBE: "Niet beschreven",
};
export interface SpecimenCode {
  code: string;
  nl: string;
  en: string;
}
