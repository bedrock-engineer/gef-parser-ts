import { Unit } from "./gef-cpt.js";
import {
  heightDeterminationCodes,
  placeDeterminationCodes,
} from "./location-codes.js";

interface CptColumnQuantity {
  name: string;
  nameNl: string;
  unit: Unit | null;
  description: string;
  descriptionNl: string;
  required: boolean;
  category: string;
  symbol: string | null;
}
export const cptColumnQuantities: Record<number, CptColumnQuantity> = {
  1: {
    name: "Penetration length",
    nameNl: "Sondeerlengte",
    unit: "m",
    description: "Depth of cone tip below fixed horizontal surface",
    descriptionNl: "Diepte van conuspunt onder vast horizontaal oppervlak",
    required: true,
    category: "primary",
    symbol: null,
  },

  2: {
    name: "Measured cone resistance",
    nameNl: "Gemeten conusweerstand",
    unit: "MPa",
    description: "Direct cone tip resistance measurement",
    descriptionNl: "Directe conuspunt weerstandsmeting",
    required: true,
    category: "primary",
    symbol: "qc",
  },

  3: {
    name: "Friction resistance",
    nameNl: "Wrijvingsweerstand",
    unit: "MPa",
    description: "Sleeve friction measurement",
    descriptionNl: "Mantelwrijvingsmeting",
    required: false,
    category: "friction",
    symbol: null,
  },

  4: {
    name: "Friction number",
    nameNl: "Wrijvingsgetal",
    unit: "%",
    description: "Friction ratio percentage",
    descriptionNl: "Wrijvingsratio percentage",
    required: false,
    category: "friction",
    symbol: null,
  },

  5: {
    name: "Pore pressure u1",
    nameNl: "Waterspanning u1",
    unit: "MPa",
    description: "Pore pressure at cone tip",
    descriptionNl: "Waterspanning bij conuspunt",
    required: false,
    category: "pore_pressure",
    symbol: "u1",
  },

  6: {
    name: "Pore pressure u2",
    nameNl: "Waterspanning u2",
    unit: "MPa",
    description: "Pore pressure at cone shoulder",
    descriptionNl: "Waterspanning bij conusschouder",
    required: false,
    category: "pore_pressure",
    symbol: "u2",
  },

  7: {
    name: "Pore pressure u3",
    nameNl: "Waterspanning u3",
    unit: "MPa",
    description: "Pore pressure at friction sleeve",
    descriptionNl: "Waterspanning bij wrijvingsmantel",
    required: false,
    category: "pore_pressure",
    symbol: "u3",
  },

  8: {
    name: "Inclination (resultant)",
    nameNl: "Helling (resultante)",
    unit: "degrees",
    description: "Total inclination from vertical",
    descriptionNl: "Totale helling t.o.v. verticaal",
    required: false,
    category: "inclination",
    symbol: null,
  },

  9: {
    name: "Inclination N-S",
    nameNl: "Helling N-Z",
    unit: "degrees",
    description: "North-South inclination component",
    descriptionNl: "Noord-Zuid hellingscomponent",
    required: false,
    category: "inclination",
    symbol: null,
  },

  10: {
    name: "Inclination E-W",
    nameNl: "Helling O-W",
    unit: "degrees",
    description: "East-West inclination component",
    descriptionNl: "Oost-West hellingscomponent",
    required: false,
    category: "inclination",
    symbol: null,
  },

  11: {
    name: "Corrected depth",
    nameNl: "Gecorrigeerde diepte",
    unit: "m",
    description: "Corrected depth below fixed horizontal surface",
    descriptionNl: "Gecorrigeerde diepte onder vast horizontaal oppervlak",
    required: false,
    category: "calculated",
    symbol: null,
  },

  12: {
    name: "Time",
    nameNl: "Tijd",
    unit: "s",
    description: "Time of measurement",
    descriptionNl: "Tijd van meting",
    required: false,
    category: "measurement_info",
    symbol: null,
  },

  13: {
    name: "Corrected cone resistance",
    nameNl: "Gecorrigeerde conusweerstand",
    unit: "MPa",
    description: "Cone resistance corrected for pore pressure effects",
    descriptionNl: "Conusweerstand gecorrigeerd voor waterspanningseffecten",
    required: false,
    category: "calculated",
    symbol: "qt",
  },

  14: {
    name: "Net cone resistance",
    nameNl: "Netto conusweerstand",
    unit: "MPa",
    description: "Net cone resistance",
    descriptionNl: "Netto conusweerstand",
    required: false,
    category: "calculated",
    symbol: "qn",
  },

  15: {
    name: "Pore ratio",
    nameNl: "Poriënratio",
    unit: "-",
    description: "Pore pressure ratio",
    descriptionNl: "Waterspanningsratio",
    required: false,
    category: "calculated",
    symbol: "Bq",
  },

  16: {
    name: "Cone resistance number",
    nameNl: "Conusweerstandsgetal",
    unit: "-",
    description: "Normalized cone resistance",
    descriptionNl: "Genormaliseerde conusweerstand",
    required: false,
    category: "calculated",
    symbol: "Nm",
  },

  17: {
    name: "Weight per unit volume",
    nameNl: "Volumegewicht",
    unit: "kN/m³",
    description: "Unit weight of soil",
    descriptionNl: "Volumegewicht van grond",
    required: false,
    category: "soil_properties",
    symbol: "γ",
  },

  18: {
    name: "In-situ initial pore pressure",
    nameNl: "In-situ initiële waterspanning",
    unit: "MPa",
    description: "Initial pore water pressure",
    descriptionNl: "Initiële poriënwaterdruk",
    required: false,
    category: "soil_properties",
    symbol: "u0",
  },

  19: {
    name: "Total vertical soil pressure",
    nameNl: "Totale verticale grondspanning",
    unit: "MPa",
    description: "Total overburden stress",
    descriptionNl: "Totale deklaagspanning",
    required: false,
    category: "soil_properties",
    symbol: "σv0",
  },

  20: {
    name: "Effective vertical soil pressure",
    nameNl: "Effectieve verticale grondspanning",
    unit: "MPa",
    description: "Effective overburden stress",
    descriptionNl: "Effectieve deklaagspanning",
    required: false,
    category: "soil_properties",
    symbol: "σ'v0",
  },

  21: {
    name: "Inclination in X direction",
    nameNl: "Helling in X-richting",
    unit: "degrees",
    description: "X-direction inclination component",
    descriptionNl: "X-richting hellingscomponent",
    required: false,
    category: "inclination",
    symbol: null,
  },

  22: {
    name: "Inclination in Y direction",
    nameNl: "Helling in Y-richting",
    unit: "degrees",
    description: "Y-direction inclination component",
    descriptionNl: "Y-richting hellingscomponent",
    required: false,
    category: "inclination",
    symbol: null,
  },

  23: {
    name: "Electric conductivity",
    nameNl: "Elektrische geleidbaarheid",
    unit: "S/m",
    description: "Electrical conductivity measurement",
    descriptionNl: "Elektrische geleidbaarheidsmeting",
    required: false,
    category: "additional_measurements",
    symbol: null,
  },

  24: {
    name: "Reserved for future use",
    nameNl: "Gereserveerd voor toekomstig gebruik",
    unit: null,
    description: "Reserved slot",
    descriptionNl: "Gereserveerde positie",
    required: false,
    category: "reserved",
    symbol: null,
  },

  25: {
    name: "Reserved for future use",
    nameNl: "Gereserveerd voor toekomstig gebruik",
    unit: null,
    description: "Reserved slot",
    descriptionNl: "Gereserveerde positie",
    required: false,
    category: "reserved",
    symbol: null,
  },

  26: {
    name: "Reserved for future use",
    nameNl: "Gereserveerd voor toekomstig gebruik",
    unit: null,
    description: "Reserved slot",
    descriptionNl: "Gereserveerde positie",
    required: false,
    category: "reserved",
    symbol: null,
  },

  27: {
    name: "Reserved for future use",
    nameNl: "Gereserveerd voor toekomstig gebruik",
    unit: null,
    description: "Reserved slot",
    descriptionNl: "Gereserveerde positie",
    required: false,
    category: "reserved",
    symbol: null,
  },

  28: {
    name: "Reserved for future use",
    nameNl: "Gereserveerd voor toekomstig gebruik",
    unit: null,
    description: "Reserved slot",
    descriptionNl: "Gereserveerde positie",
    required: false,
    category: "reserved",
    symbol: null,
  },

  29: {
    name: "Reserved for future use",
    nameNl: "Gereserveerd voor toekomstig gebruik",
    unit: null,
    description: "Reserved slot",
    descriptionNl: "Gereserveerde positie",
    required: false,
    category: "reserved",
    symbol: null,
  },

  30: {
    name: "Reserved for future use",
    nameNl: "Gereserveerd voor toekomstig gebruik",
    unit: null,
    description: "Reserved slot",
    descriptionNl: "Gereserveerde positie",
    required: false,
    category: "reserved",
    symbol: null,
  },

  31: {
    name: "Magnetic field strength Bx",
    nameNl: "Magnetische veldsterkte Bx",
    unit: "nT",
    description: "Magnetic field strength in X direction",
    descriptionNl: "Magnetische veldsterkte in X-richting",
    required: false,
    category: "magnetic_measurements",
    symbol: "Bx",
  },

  32: {
    name: "Magnetic field strength By",
    nameNl: "Magnetische veldsterkte By",
    unit: "nT",
    description: "Magnetic field strength in Y direction",
    descriptionNl: "Magnetische veldsterkte in Y-richting",
    required: false,
    category: "magnetic_measurements",
    symbol: "By",
  },

  33: {
    name: "Magnetic field strength Bz",
    nameNl: "Magnetische veldsterkte Bz",
    unit: "nT",
    description: "Magnetic field strength in Z direction",
    descriptionNl: "Magnetische veldsterkte in Z-richting",
    required: false,
    category: "magnetic_measurements",
    symbol: "Bz",
  },

  34: {
    name: "Total magnetic field strength",
    nameNl: "Totale magnetische veldsterkte",
    unit: "nT",
    description: "Total magnetic field strength",
    descriptionNl: "Totale magnetische veldsterkte",
    required: false,
    category: "magnetic_measurements",
    symbol: "Btot",
  },

  35: {
    name: "Magnetic inclination",
    nameNl: "Magnetische inclinatie",
    unit: "degrees",
    description: "Magnetic field inclination angle",
    descriptionNl: "Magnetische veld inclinatiehoek",
    required: false,
    category: "magnetic_measurements",
    symbol: null,
  },

  36: {
    name: "Magnetic declination",
    nameNl: "Magnetische declinatie",
    unit: "degrees",
    description: "Magnetic field declination angle",
    descriptionNl: "Magnetische veld declinatiehoek",
    required: false,
    category: "magnetic_measurements",
    symbol: null,
  },

  128: {
    name: "Totale weerstand",
    nameNl: "Totale weerstand",
    unit: "MPa",
    description: "Totale conusweerstand Qt",
    descriptionNl: "Totale conusweerstand Qt",
    required: false,
    category: "dov_measurements",
    symbol: "Qt",
  },

  129: {
    name: "Temperatuur",
    nameNl: "Temperatuur",
    unit: "°C",
    description: "Temperatuurmeting",
    descriptionNl: "Temperatuurmeting",
    required: false,
    category: "dov_measurements",
    symbol: "T",
  },
};
export const cptMeasurementVariables = {
  1: {
    defaultValue: 1000,
    unit: "mm²",
    description: "Nominal surface area of cone tip",
    descriptionNl: "Nominaal oppervlak van conuspunt",
    category: "equipment",
    dataType: "float",
  },

  2: {
    defaultValue: 15000,
    unit: "mm²",
    description: "Nominal surface area of friction sleeve",
    descriptionNl: "Nominaal oppervlak van wrijvingsmantel",
    category: "equipment",
    dataType: "float",
  },

  3: {
    defaultValue: null,
    unit: "-",
    description: "Net surface area quotient of cone tip",
    descriptionNl: "Netto oppervlaktequotiënt van conuspunt",
    category: "equipment",
    dataType: "float",
  },

  4: {
    defaultValue: null,
    unit: "-",
    description: "Net surface area quotient of friction sleeve",
    descriptionNl: "Netto oppervlaktequotiënt van wrijvingsmantel",
    category: "equipment",
    dataType: "float",
  },

  5: {
    defaultValue: 100,
    unit: "mm",
    description: "Distance of cone to centre of friction sleeve",
    descriptionNl: "Afstand van conus tot midden wrijvingsmantel",
    category: "equipment",
    dataType: "float",
  },

  6: {
    defaultValue: null,
    unit: "-",
    description: "Friction present",
    descriptionNl: "Wrijving aanwezig",
    category: "capabilities",
    dataType: "enum",

    options: [
      { value: 0, meaning: "no" },
      { value: 1, meaning: "yes" },
    ],
  },

  7: {
    defaultValue: null,
    unit: "-",
    description: "PPT u1 present",
    descriptionNl: "PPT u1 aanwezig",
    category: "capabilities",
    dataType: "enum",

    options: [
      { value: 0, meaning: "no" },
      { value: 1, meaning: "yes" },
    ],
  },

  8: {
    defaultValue: null,
    unit: "-",
    description: "PPT u2 present",
    descriptionNl: "PPT u2 aanwezig",
    category: "capabilities",
    dataType: "enum",

    options: [
      { value: 0, meaning: "no" },
      { value: 1, meaning: "yes" },
    ],
  },

  9: {
    defaultValue: null,
    unit: "-",
    description: "PPT u3 present",
    descriptionNl: "PPT u3 aanwezig",
    category: "capabilities",
    dataType: "enum",

    options: [
      { value: 0, meaning: "no" },
      { value: 1, meaning: "yes" },
    ],
  },

  10: {
    defaultValue: null,
    unit: "-",
    description: "Inclination measurement present",
    descriptionNl: "Hellingsmeting aanwezig",
    category: "capabilities",
    dataType: "enum",

    options: [
      { value: 0, meaning: "no" },
      { value: 1, meaning: "yes" },
    ],
  },

  11: {
    defaultValue: null,
    unit: "-",
    description: "Use of back-flow compensator",
    descriptionNl: "Gebruik van terugstroomcompensator",
    category: "equipment",
    dataType: "enum",

    options: [
      { value: 0, meaning: "no" },
      { value: 1, meaning: "yes" },
    ],
  },

  12: {
    defaultValue: null,
    unit: "-",
    description: "Type of cone penetration test",
    descriptionNl: "Type conuspenetratietest",
    category: "test_type",
    dataType: "enum",

    options: [
      { value: 0, meaning: "electronic penetration test" },
      { value: 1, meaning: "mechanical discontinue" },
      { value: 2, meaning: "mechanical continue" },
    ],
  },

  13: {
    defaultValue: null,
    unit: "m",
    description: "Pre-excavated depth",
    descriptionNl: "Voorontgraven diepte",
    category: "site_conditions",
    dataType: "float",
  },

  14: {
    defaultValue: null,
    unit: "m",

    description:
      "Groundwater level (with respect to datum of height system in ZID)",

    descriptionNl: "Grondwaterstand (t.o.v. datum van hoogtestelsel in ZID)",
    category: "site_conditions",
    dataType: "float",
  },

  15: {
    defaultValue: null,
    unit: "m",
    description: "Water depth (for offshore activities)",
    descriptionNl: "Waterdiepte (voor offshore activiteiten)",
    category: "site_conditions",
    dataType: "float",
  },

  16: {
    defaultValue: null,
    unit: "m",
    description: "End depth of penetration test",
    descriptionNl: "Einddiepte van penetratietest",
    category: "test_execution",
    dataType: "float",
  },

  17: {
    defaultValue: null,
    unit: "-",
    description: "Stop criteria",
    descriptionNl: "Stopcriteria",
    category: "test_execution",
    dataType: "enum",

    options: [
      { value: 0, meaning: "end depth reached" },
      { value: 1, meaning: "max. penetration force" },
      { value: 2, meaning: "cone value" },
      { value: 3, meaning: "max. friction value" },
      { value: 4, meaning: "max. PPT value" },
      { value: 5, meaning: "max. inclination value" },
      { value: 6, meaning: "obstacle" },
      { value: 7, meaning: "danger of buckling" },
    ],
  },

  20: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement of cone before penetration test",
    descriptionNl: "Nulmeting van conus vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  21: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement of cone after penetration test",
    descriptionNl: "Nulmeting van conus na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  22: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement friction before penetration test",
    descriptionNl: "Nulmeting wrijving vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  23: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement friction after penetration test",
    descriptionNl: "Nulmeting wrijving na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  24: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement PPT u1 before penetration test",
    descriptionNl: "Nulmeting PPT u1 vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  25: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement PPT u1 after penetration test",
    descriptionNl: "Nulmeting PPT u1 na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  26: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement PPT u2 before penetration test",
    descriptionNl: "Nulmeting PPT u2 vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  27: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement PPT u2 after penetration test",
    descriptionNl: "Nulmeting PPT u2 na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  28: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement PPT u3 before penetration test",
    descriptionNl: "Nulmeting PPT u3 vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  29: {
    defaultValue: null,
    unit: "MPa",
    description: "Zero measurement PPT u3 after penetration test",
    descriptionNl: "Nulmeting PPT u3 na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  30: {
    defaultValue: null,
    unit: "degrees",
    description: "Zero measurement inclination before penetration test",
    descriptionNl: "Nulmeting helling vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  31: {
    defaultValue: null,
    unit: "degrees",
    description: "Zero measurement inclination after penetration test",
    descriptionNl: "Nulmeting helling na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  32: {
    defaultValue: null,
    unit: "degrees",
    description: "Zero measurement inclination NS before penetration test",
    descriptionNl: "Nulmeting helling NZ vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  33: {
    defaultValue: null,
    unit: "degrees",
    description: "Zero measurement inclination NS after penetration test",
    descriptionNl: "Nulmeting helling NZ na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  34: {
    defaultValue: null,
    unit: "degrees",
    description: "Zero measurement inclination EW before penetration test",
    descriptionNl: "Nulmeting helling OW vóór penetratietest",
    category: "calibration",
    dataType: "float",
  },

  35: {
    defaultValue: null,
    unit: "degrees",
    description: "Zero measurement inclination EW after penetration test",
    descriptionNl: "Nulmeting helling OW na penetratietest",
    category: "calibration",
    dataType: "float",
  },

  41: {
    defaultValue: null,
    unit: "km",
    description: "Mileage",
    descriptionNl: "Kilometrering",
    category: "location",
    dataType: "float",
  },

  42: {
    defaultValue: null,
    unit: "degrees",
    description: "Orientation between X axis inclination and North",
    descriptionNl: "Oriëntatie tussen X-as helling en Noord",
    category: "location",
    dataType: "float",
  },
};
export const cptMeasurementTextVariables = {
  1: {
    description: "Client",
    descriptionNl: "Opdrachtgever",
    category: "project_info",
    example: "ABC Engineering Company",
  },

  2: {
    description: "Name of the project",
    descriptionNl: "Naam van het project",
    category: "project_info",
    example: "Highway A1 Extension",
  },

  3: {
    description: "Name of the location",
    descriptionNl: "Naam van de locatie",
    category: "project_info",
    example: "Rotterdam Port Area",
  },

  4: {
    description: "Cone type and serial number",
    descriptionNl: "Conustype en serienummer",
    category: "equipment",
    example: "Fugro Type A, Serial 12345",
  },

  5: {
    description: "Mass and geometry of probe apparatus, including anchoring",

    descriptionNl:
      "Massa en geometrie van sondeerinstallatie, inclusief verankering",

    category: "equipment",
    example: "Mass: 2500kg, Length: 15m, Anchoring: hydraulic",
  },

  6: {
    description: "Applied standard, including class",
    descriptionNl: "Toegepaste norm, inclusief klasse",
    category: "standards",
    example: "NEN 5140 Class 1, NEN 3680",
  },

  7: {
    description: "Own coordinate system",
    descriptionNl: "Eigen coördinatenstelsel",
    category: "coordinates",
    example: "Local site grid, origin at building corner",
  },

  8: {
    description: "Own reference level",
    descriptionNl: "Eigen referentieniveau",
    category: "coordinates",
    example: "Site datum +5.00m above MSL",
  },

  9: {
    description: "Fixed horizontal level (usually: ground level or flow bed)",
    descriptionNl: "Vast horizontaal niveau (meestal: maaiveld of stroombed)",
    category: "coordinates",
    example: "+2.35m NAP",
  },

  10: {
    description:
      "Orientation direction biaxial inclination measurement (N-direction)",

    descriptionNl: "Oriëntatierichting biaxiale hellingsmeting (N-richting)",
    category: "measurements",
    example: "North = 0°, magnetic declination +2°",
  },

  11: {
    description: "Unusual circumstances",
    descriptionNl: "Bijzondere omstandigheden",
    category: "conditions",
    example: "Heavy rain during test, vibrations from nearby construction",
  },

  12: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  13: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  14: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  15: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  16: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  17: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  18: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  19: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  20: {
    description: "Correction method for zero drift",
    descriptionNl: "Correctiemethode voor nuldrift",
    category: "processing",
    example: "Linear interpolation between pre/post zero measurements",
  },

  21: {
    description: "Method for processing interruptions",
    descriptionNl: "Methode voor verwerking van onderbrekingen",
    category: "processing",
    example: "Data gap filled using adjacent measurements",
  },

  22: {
    description: "Remarks",
    descriptionNl: "Opmerkingen",
    category: "general",
    example: "Test performed according to project specifications",
  },

  23: {
    description: "Remarks",
    descriptionNl: "Opmerkingen",
    category: "general",
    example: "Groundwater encountered at 3.2m depth",
  },

  24: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  25: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  26: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  27: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  28: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  29: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  30: {
    description: "Calculation formula or reference for column number",
    descriptionNl: "Berekeningsformule of referentie voor kolomnummer",
    category: "calculations",
    example: "Friction ratio = (fs/qc) × 100%",
  },

  31: {
    description: "Calculation formula or reference for column number",
    descriptionNl: "Berekeningsformule of referentie voor kolomnummer",
    category: "calculations",
    example: "Corrected cone resistance = qc + u2(1-a)",
  },

  32: {
    description: "Calculation formula or reference for column number",
    descriptionNl: "Berekeningsformule of referentie voor kolomnummer",
    category: "calculations",
    example: "Net cone resistance = qc - σvo",
  },

  33: {
    description: "Calculation formula or reference for column number",
    descriptionNl: "Berekeningsformule of referentie voor kolomnummer",
    category: "calculations",
    example: "Pore pressure ratio = (u2 - u0) / (qc - σvo)",
  },

  34: {
    description: "Calculation formula or reference for column number",
    descriptionNl: "Berekeningsformule of referentie voor kolomnummer",
    category: "calculations",

    example:
      "Soil behavior type index = sqrt((3.47-log10(Qt))^2 + (log10(Fr)+1.22)^2)",
  },

  35: {
    description: "Calculation formula or reference for column number",
    descriptionNl: "Berekeningsformule of referentie voor kolomnummer",
    category: "calculations",
    example: "Normalized cone resistance = (qc - σvo) / σ'vo",
  },

  36: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  37: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  38: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  39: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  40: {
    description: "Reserved for future use",
    descriptionNl: "Gereserveerd voor toekomstig gebruik",
    category: "reserved",
    example: null,
  },

  41: {
    description: "Highway, railway or dike code",
    descriptionNl: "Rijksweg-, spoorweg- of dijkcode",
    category: "infrastructure",
    example: "Railway line A16, km 23.4",
  },

  42: {
    description: "Method for determination of ZID (height)",
    descriptionNl: "Methode voor bepaling van ZID (hoogte)",
    category: "coordinates",
    example: "MMET (Measured, surveying)",
    standardizedCodes: heightDeterminationCodes,
  },

  43: {
    description: "Method for determination of XYID (position)",
    descriptionNl: "Methode voor bepaling van XYID (positie)",
    category: "coordinates",
    example: "LMET (Measured, surveying)",
    standardizedCodes: placeDeterminationCodes,
  },

  44: {
    description: "Orientation of X axis of inclination measurement",
    descriptionNl: "Oriëntatie van X-as van hellingsmeting",
    category: "measurements",
    example: "X-axis aligned with magnetic north",
  },
};

// =============================================================================
// DUTCH EXTENSIONS (BRO + VOTB)
// BRO: Basis Registratie Ondergrond - regulatory submission fields
// VOTB: Vereniging Ondernemers Technisch Bodemonderzoek - industry fields
// =============================================================================

export const broMeasurementTextVariables = {
  101: {
    description: "Data holder",
    descriptionNl: "Bronhouder",
    category: "bro_submission",
    example: "Bronhouder, 52605825, 31",
  },

  102: {
    description: "Delivery framework",
    descriptionNl: "Kader aanlevering",
    category: "bro_submission",
    example: "opdracht publieke taakuitvoering",
  },

  103: {
    description: "Investigation purpose",
    descriptionNl: "Kader inwinning",
    category: "bro_submission",
    example: "overig onderzoek",
  },

  104: {
    description: "Location surveyor",
    descriptionNl: "Uitvoerder locatiebepaling",
    category: "bro_submission",
    example: "24257098, 31",
  },

  105: {
    description: "Location determination date",
    descriptionNl: "Datum locatiebepaling",
    category: "bro_submission",
    example: "2019, 01, 29",
  },

  106: {
    description: "Elevation surveyor",
    descriptionNl: "Uitvoerder verticale positiebepaling",
    category: "bro_submission",
    example: "24257098, 31",
  },

  107: {
    description: "Elevation determination date",
    descriptionNl: "Datum verticale positiebepaling",
    category: "bro_submission",
    example: "2019, 01, 29",
  },

  108: {
    description: "Surface conditions",
    descriptionNl: "Hoedanigheid oppervlakte",
    category: "bro_submission",
    example: "verhard",
  },

  109: {
    description: "Dissipation test performed",
    descriptionNl: "Dissipatietest uitgevoerd",
    category: "bro_submission",
    example: "nee",
  },

  110: {
    description: "Expert correction performed",
    descriptionNl: "Expertcorrectie uitgevoerd",
    category: "bro_submission",
    example: "ja",
  },

  111: {
    description: "Additional investigation performed",
    descriptionNl: "Aanvullend onderzoek uitgevoerd",
    category: "bro_submission",
    example: "nee",
  },

  112: {
    description: "Reporting date",
    descriptionNl: "Rapportagedatum onderzoek",
    category: "bro_submission",
    example: "2019, 01, 31",
  },

  113: {
    description: "Last processing date",
    descriptionNl: "Datum laatste bewerking",
    category: "bro_submission",
    example: "2019, 01, 30",
  },

  114: {
    description: "Investigation date",
    descriptionNl: "Datum onderzoek",
    category: "bro_submission",
    example: "2019, 01, 29",
  },

  115: {
    description: "Quality regime",
    descriptionNl: "Kwaliteitsregime",
    category: "bro_registration",
    example: "IMBRO/A",
  },

  116: {
    description: "Registration timestamp",
    descriptionNl: "Tijdstip registratie object",
    category: "bro_registration",
    example: "2019-02-15T10:30:00",
  },

  117: {
    description: "Registration status",
    descriptionNl: "Registratiestatus",
    category: "bro_registration",
    example: "voltooid",
  },

  118: {
    description: "Registration completion timestamp",
    descriptionNl: "Tijdstip voltooiing registratie",
    category: "bro_registration",
    example: "2019-02-15T10:30:00",
  },

  119: {
    description: "Corrected indicator",
    descriptionNl: "Gecorrigeerd",
    category: "bro_registration",
    example: "nee",
  },

  120: {
    description: "Last correction timestamp",
    descriptionNl: "Tijdstip laatste correctie",
    category: "bro_registration",
    example: null,
  },

  121: {
    description: "Under investigation",
    descriptionNl: "In onderzoek",
    category: "bro_registration",
    example: "nee",
  },

  122: {
    description: "Under investigation since",
    descriptionNl: "In onderzoek sinds",
    category: "bro_registration",
    example: null,
  },

  123: {
    description: "Removed from registration",
    descriptionNl: "Uit registratie genomen",
    category: "bro_registration",
    example: "nee",
  },

  124: {
    description: "Removal timestamp",
    descriptionNl: "Tijdstip uit registratie genomen",
    category: "bro_registration",
    example: null,
  },

  125: {
    description: "Re-registered",
    descriptionNl: "Weer in registratie genomen",
    category: "bro_registration",
    example: "nee",
  },

  126: {
    description: "Re-registration timestamp",
    descriptionNl: "Tijdstip weer in registratie genomen",
    category: "bro_registration",
    example: null,
  },

  127: {
    description: "Standardized location reference system",
    descriptionNl: "Gestandaardiseerde locatie referentiestelsel",
    category: "bro_registration",
    example: "EPSG:28992",
  },

  128: {
    description: "Coordinate transformation",
    descriptionNl: "Coördinaattransformatie",
    category: "bro_registration",
    example: "nee",
  },
};

export const votbMeasurementTextVariables = {
  1100: {
    description: "Filter material type for pore pressure filter",
    descriptionNl: "Type filtermateriaal voor waterspanningsfilter",
    category: "votb_equipment",
    example: "sintered steel",
  },

  1101: {
    description: "Use of friction reducer",
    descriptionNl: "Gebruik kleefbreker",
    category: "votb_equipment",
    example: "ja",
  },

  1102: {
    description: "Type of friction reducer",
    descriptionNl: "Type kleefbreker",
    category: "votb_equipment",
    example: "mechanical",
  },

  1103: {
    description: "Fluid type for wash boring",
    descriptionNl: "Type vloeistof bij spoelsondering",
    category: "votb_equipment",
    example: "water",
  },

  1104: {
    description: "Inclinometer position",
    descriptionNl: "Positie hellingmeter",
    category: "votb_equipment",
    example: "in cone",
  },

  1105: {
    description: "Dissipation test with closed pressure clamp",
    descriptionNl: "Dissipatietest met gesloten drukklem",
    category: "votb_test",
    example: "nee",
  },

  1106: {
    description: "Postal code for project location",
    descriptionNl: "Postcode voor de projectlocatie",
    category: "votb_location",
    example: "3011 AA",
  },

  1107: {
    description: "Street name of project location",
    descriptionNl: "Straatnaam van de projectlocatie",
    category: "votb_location",
    example: "Coolsingel",
  },

  1108: {
    description: "City of project location",
    descriptionNl: "Plaats van de projectlocatie",
    category: "votb_location",
    example: "Rotterdam",
  },

  1109: {
    description: "Province of project location",
    descriptionNl: "Provincie waarin de projectlocatie is gelegen",
    category: "votb_location",
    example: "Zuid-Holland",
  },

  1110: {
    description: "Country of project",
    descriptionNl: "Land waar het project in is gelegen",
    category: "votb_location",
    example: "Nederland",
  },
};

export const broMeasurementVariables = {
  101: {
    unit: "m",
    description: "Penetration length",
    descriptionNl: "Sondeertrajectlengte",
    dataType: "float",
  },

  102: {
    unit: "m",
    description: "Depth",
    descriptionNl: "Diepte",
    dataType: "float",
  },

  103: {
    unit: "s",
    description: "Elapsed time",
    descriptionNl: "Verlopen tijd",
    dataType: "float",
  },

  104: {
    unit: "MPa",
    description: "Cone resistance",
    descriptionNl: "Conusweerstand",
    dataType: "float",
  },

  105: {
    unit: "MPa",
    description: "Corrected cone resistance",
    descriptionNl: "Gecorrigeerde conusweerstand",
    dataType: "float",
  },

  106: {
    unit: "MPa",
    description: "Net cone resistance",
    descriptionNl: "Netto conusweerstand",
    dataType: "float",
  },

  107: {
    unit: "nT",
    description: "Magnetic field strength x",
    descriptionNl: "Magnetische veldsterkte x",
    dataType: "float",
  },

  108: {
    unit: "nT",
    description: "Magnetic field strength y",
    descriptionNl: "Magnetische veldsterkte y",
    dataType: "float",
  },

  109: {
    unit: "nT",
    description: "Magnetic field strength z",
    descriptionNl: "Magnetische veldsterkte z",
    dataType: "float",
  },

  110: {
    unit: "nT",
    description: "Total magnetic field strength",
    descriptionNl: "Totale magnetische veldsterkte",
    dataType: "float",
  },

  111: {
    unit: "S/m",
    description: "Electrical conductivity",
    descriptionNl: "Electrische geleidbaarheid",
    dataType: "float",
  },

  112: {
    unit: "degrees",
    description: "Inclination east-west",
    descriptionNl: "Helling oost-west",
    dataType: "float",
  },

  113: {
    unit: "degrees",
    description: "Inclination north-south",
    descriptionNl: "Helling noord-zuid",
    dataType: "float",
  },

  114: {
    unit: "degrees",
    description: "Inclination x",
    descriptionNl: "Helling x",
    dataType: "float",
  },

  115: {
    unit: "degrees",
    description: "Inclination y",
    descriptionNl: "Helling y",
    dataType: "float",
  },

  116: {
    unit: "degrees",
    description: "Resultant inclination",
    descriptionNl: "Hellingresultante",
    dataType: "float",
  },

  117: {
    unit: "degrees",
    description: "Magnetic inclination",
    descriptionNl: "Magnetische inclinatie",
    dataType: "float",
  },

  118: {
    unit: "degrees",
    description: "Magnetic declination",
    descriptionNl: "Magnetische declinatie",
    dataType: "float",
  },

  119: {
    unit: "MPa",
    description: "Local friction",
    descriptionNl: "Plaatselijke wrijving",
    dataType: "float",
  },

  120: {
    unit: "-",
    description: "Pore ratio",
    descriptionNl: "Poriënratio",
    dataType: "float",
  },

  121: {
    unit: "°C",
    description: "Temperature",
    descriptionNl: "Temperatuur",
    dataType: "float",
  },

  122: {
    unit: "MPa",
    description: "Pore pressure u1",
    descriptionNl: "Waterspanning u1",
    dataType: "float",
  },

  123: {
    unit: "MPa",
    description: "Pore pressure u2",
    descriptionNl: "Waterspanning u2",
    dataType: "float",
  },

  124: {
    unit: "%",
    description: "Friction ratio",
    descriptionNl: "Wrijvingsgetal",
    dataType: "float",
  },

  130: {
    unit: "mm",
    description: "Cone diameter before test",
    descriptionNl: "Conusdiameter voor test",
    category: "bro_equipment",
    dataType: "float",
  },
};

export const klasse1MeasurementTextVariables = {
  1000: { descriptionNl: "Type test", descriptionEn: "test type" },
  1001: {
    descriptionNl: "Bijzonderheden of afwijkingen van iso 22476",
    descriptionEn: "particulars or deviations from this part of iso 22476",
  },
  1002: { descriptionNl: "Sondeerbaas", descriptionEn: "equipment operator" },
  1003: {
    descriptionNl: "Type bodemmateriaal aangetroffen (indien mogelijk)",
    descriptionEn: "type of materials encountered (if possible)",
  },
  1004: {
    descriptionNl:
      "Diepte penetratie en mogelijke oorzaken van onderbrekingen (b.v. dissipatietesten)",
    descriptionEn:
      "depth of penetration and possible causes of any interruptions (like dissipation tests)",
  },
  1005: {
    descriptionNl: "Methode van afdichten (indien van toepassing)",
    descriptionEn: "method of backfilling the hole (if applicable)",
  },
  1006: {
    descriptionNl: "Aanwezigheid van stenen",
    descriptionEn: "presence of stones",
  },
  1007: {
    descriptionNl: "Geluid van de sondeerstangen",
    descriptionEn: "noise from the pushing rods",
  },
  1008: { descriptionNl: "Incidenten", descriptionEn: "incidents" },
  1009: { descriptionNl: "Verbogen stangen", descriptionEn: "buckled rods" },
  1010: {
    descriptionNl: "Afwijkende slijtage",
    descriptionEn: "abnormal wear",
  },
  1011: {
    descriptionNl:
      "Significante veranderingen in nul metingen of referentie metingen",
    descriptionEn: "significant changes in zero or reference readings",
  },
  1012: {
    descriptionNl:
      "Afwijkingen in opstelling sondeerunit (b.v. jack-up platform)",
    descriptionEn:
      "specific arrangements that deviate from common set up of thrust machine (like a jack-up platform) ",
  },
  1013: {
    descriptionNl: "Leverancier conus",
    descriptionEn: "manufacturer of cone penetrometer",
  },
  1014: {
    descriptionNl: "Datum laatste calibratie sensoren",
    descriptionEn: "date of last calibration of sensors  ",
  },
  1015: {
    descriptionNl:
      "Type vloeistof in meetkamer voor meting waterspanning (bij waterspanningssonderingen)",
    descriptionEn:
      "saturation fluid used in pore pressure system (if piezocone) ",
  },
  1016: {
    descriptionNl: "Rechtheid van sondeerstangen",
    descriptionEn: "linearity of the pushing rods",
  },
  1017: {
    descriptionNl: "Controle helling voor test",
    descriptionEn: "inclination control before test",
  },
  1018: {
    descriptionNl: "Controle helling na test",
    descriptionEn: "inclination control after test",
  },
  1019: {
    descriptionNl: "Vertikaalstand drukunit voor test",
    descriptionEn: "verticality of thrust machine before test",
  },
  1020: {
    descriptionNl: "Vertikaalstand drukunit na test",
    descriptionEn: "verticality of thrust machine after test",
  },
};

export const klasse1MeasurementVariables = {
  1000: {
    unit: "mm",
    dataType: "float",
    description: "Cone tip diameter after test",
    descriptionNl: "Conuspuntdiameter na test",
  },
  1001: {
    unit: "mm",
    dataType: "float",
    description: "Friction sleeve diameter before test (low)",
    descriptionNl: "Mantel diameter voor test (onder)",
  },
  1002: {
    unit: "mm",
    dataType: "float",
    description: "Friction sleeve diameter after test (low)",
    descriptionNl: "Mantel diameter na test (onder)",
  },
  1003: {
    unit: "mm",
    dataType: "float",
    description: "Friction sleeve diameter before test (mid)",
    descriptionNl: "Mantel diameter voor test (midden)",
  },
  1004: {
    unit: "mm",
    dataType: "float",
    description: "Friction sleeve diameter after test (mid)",
    descriptionNl: "Mantel diameter na test (midden)",
  },
  1005: {
    unit: "mm",
    dataType: "float",
    description: "Friction sleeve diameter before test (top)",
    descriptionNl: "Mantel diameter voor test (boven)",
  },
  1006: {
    unit: "mm",
    dataType: "float",
    description: "Friction sleeve diameter after test (top)",
    descriptionNl: "Mantel diameter na test (boven)",
  },
  1007: {
    unit: "mm",
    dataType: "float",
    description: "Height of conical part of cone tip before test",
    descriptionNl: "Hoogte conisch gedeelte conuspunt voor test",
  },
  1008: {
    unit: "mm",
    dataType: "float",
    description: "Height of conical part of cone tip after test",
    descriptionNl: "Hoogte conisch gedeelte conuspunt na test",
  },
  1009: {
    unit: "mm",
    dataType: "float",
    description: "Length of cone tip extension before test",
    descriptionNl: "Hoogte conuspunt extentie voor test",
  },
  1010: {
    unit: "mm",
    dataType: "float",
    description: "Length of cone tip extension after test",
    descriptionNl: "Hoogte conuspunt extentie na test",
  },
  1011: {
    unit: "mm",
    dataType: "float",
    description: "Length of the friction sleeve before test",
    descriptionNl: "Lengte kleefmantel voor test",
  },
  1012: {
    unit: "mm",
    dataType: "float",
    description: "Length of the friction sleeve after test",
    descriptionNl: "Lengte kleefmantel na test",
  },
  1013: {
    unit: "MPa",
    dataType: "float",
    description: "Measuring ranges of cone tip",
    descriptionNl: "Meetbereik puntweerstand",
  },
  1014: {
    unit: "MPa",
    dataType: "float",
    description: "Measuring ranges of friction sleeve",
    descriptionNl: "Meetbereik mantelwrijving",
  },
  1015: {
    unit: "MPa",
    dataType: "float",
    description: "Measuring ranges of pore pressure",
    descriptionNl: "Meetbereik waterspanning",
  },
  1016: {
    unit: "-",
    dataType: "float",
    description: "Net area ratio nominal",
    descriptionNl: "Netto oppervlakteverhouding nominaal",
  },
  1017: {
    unit: "-",
    dataType: "float",
    description: "Measured net area ratio",
    descriptionNl: "Netto oppervlakteverhouding gemeten",
  },
  1018: {
    unit: "m",
    dataType: "float",
    description: "Depth of casing applied",
    descriptionNl: "Diepte tot waarop steuncasing is toegepast",
  },
  1019: {
    unit: "m",
    dataType: "float",
    description: "Back filling from",
    descriptionNl: "Afdichting sondeergat van",
  },
  1020: {
    unit: "m",
    dataType: "float",
    description: "Back filling to",
    descriptionNl: "Afdichting sondeergat tot",
  },
};

export const votbMeasurementVariables = {
  1100: {
    unit: "µm",
    description: "Pore diameter of filter material",
    descriptionNl: "Poriëndiameter filtermateriaal waterspanningsfilter",
    category: "votb_equipment",
    dataType: "float",
  },

  1101: {
    unit: "mm",
    description: "Filter diameter behind cone tip",
    descriptionNl: "Diameter filter achter conuspunt",
    category: "votb_equipment",
    dataType: "float",
  },

  1102: {
    unit: "mm",
    description: "Distance friction reducer to cone tip",
    descriptionNl: "Afstand kleefbreker tot conuspunt",
    category: "votb_equipment",
    dataType: "float",
  },

  1103: {
    unit: "°C",
    description: "Cone temperature before test",
    descriptionNl: "Temperatuur conus voor test",
    category: "votb_calibration",
    dataType: "float",
  },

  1104: {
    unit: "°C",
    description: "Ambient temperature before test",
    descriptionNl: "Temperatuur omgeving voor test",
    category: "votb_calibration",
    dataType: "float",
  },
};
// =============================================================================
// BELGIAN EXTENSIONS (DOV - Databank Ondergrond Vlaanderen)
// =============================================================================

export const belgianMeasurementTextVariables = {
  100: {
    description: "Testtype",
    category: "dov_execution",
    example: "sondering",
  },

  130: {
    description: "Watermeting tijdstip",
    category: "dov_execution",
    example: "voor sondering",
  },

  131: {
    description: "Grondsoort bij conus",
    category: "dov_execution",
    example: "zand",
  },

  132: {
    description: "Buisgewichtcorrectie",
    category: "dov_execution",
    example: "ja",
  },

  133: {
    description: "Stanggewichtcorrectie",
    category: "dov_execution",
    example: "ja",
  },

  134: {
    description: "Kalibratiedatum",
    category: "dov_calibration",
    example: "2019-01-15",
  },

  135: {
    description: "Conus calibratie datum",
    category: "dov_calibration",
    example: "2019-01-15",
  },

  136: {
    description: "Leverancier conus",
    category: "dov_equipment",
    example: "Fugro",
  },

  137: {
    description: "Methode verzadiging voor U conus",
    category: "dov_equipment",
    example: "glycerine",
  },

  138: {
    description: "Conustype",
    category: "dov_equipment",
    example: "electric",
  },

  139: {
    description: "Opvullen van sondeergat",
    category: "dov_execution",
    example: "ja",
  },

  140: {
    description: "Afwijkingen van de norm",
    category: "dov_remarks",
    example: "geen",
  },

  141: {
    description: "Reden vroegtijdig stoppen",
    category: "dov_remarks",
    example: "obstakel",
  },

  142: {
    description: "Hernemen sondering",
    category: "dov_remarks",
    example: "hervat na herpositionering",
  },

  143: {
    description: "Speciale opstellingen",
    category: "dov_remarks",
    example: "platform gemonteerd",
  },

  144: {
    description: "Waarneming tijdens uitvoering",
    category: "dov_remarks",
    example: "grondwater instroming waargenomen",
  },
};

export const belgianMeasurementVariables = {
  155: {
    unit: "MPa",
    description: "Nulpunt Qt voor de meting",
    category: "dov_calibration",
    dataType: "float",
  },

  156: {
    unit: "MPa",
    description: "Nulpunt Qt na de meting",
    category: "dov_calibration",
    dataType: "float",
  },

  157: {
    unit: "°C",
    description: "Nulpunt T voor de meting",
    category: "dov_calibration",
    dataType: "float",
  },

  158: {
    unit: "°C",
    description: "Nulpunt T na de meting",
    category: "dov_calibration",
    dataType: "float",
  },

  130: {
    unit: "-",
    description: "Indringing",
    category: "dov_execution",
    dataType: "float",
  },

  131: {
    unit: "m",
    description: "Dichtvallen sondeergat op",
    category: "dov_execution",
    dataType: "float",
  },

  132: {
    unit: "m",
    description: "Diepte plaatsen kleefvanger",
    category: "dov_execution",
    dataType: "float",
  },

  133: {
    unit: "m",
    description: "Diepte plaatsen verlengbuis",
    category: "dov_execution",
    dataType: "float",
  },

  134: {
    unit: "-",
    description: "Aantal buizen",
    category: "dov_execution",
    dataType: "float",
  },

  135: {
    unit: "m",
    description: "Gemeten sondeerlengte",
    category: "dov_execution",
    dataType: "float",
  },

  138: {
    unit: "kN",
    description: "Totale drukkracht bij einde sondering",
    category: "dov_execution",
    dataType: "float",
  },

  139: {
    unit: "-",
    description: "Conuspenetrometer klasse (NBN EN ISO 22476-1:2023)",
    category: "dov_equipment",
    dataType: "string",
  },

  140: {
    unit: "kPa",
    description: "Max. toelaatbare meetonzekerheid qc",
    category: "dov_calibration",
    dataType: "float",
  },

  141: {
    unit: "kPa/°C",
    description: "Omgevingstemperatuurstabiliteit qc",
    category: "dov_calibration",
    dataType: "float",
  },

  142: {
    unit: "kPa/°C",
    description: "Wisselende temperatuurstabiliteit qc",
    category: "dov_calibration",
    dataType: "float",
  },

  143: {
    unit: "kPa/N",
    description: "Conusbelastingsinvloed qc",
    category: "dov_calibration",
    dataType: "float",
  },

  144: {
    unit: "kPa",
    description: "Max. toelaatbare meetonzekerheid fs",
    category: "dov_calibration",
    dataType: "float",
  },

  145: {
    unit: "kPa/°C",
    description: "Omgevingstemperatuurstabiliteit fs",
    category: "dov_calibration",
    dataType: "float",
  },

  146: {
    unit: "kPa/°C",
    description: "Wisselende temperatuurstabiliteit fs",
    category: "dov_calibration",
    dataType: "float",
  },

  147: {
    unit: "kPa/N",
    description: "Conusbelastingsinvloed fs",
    category: "dov_calibration",
    dataType: "float",
  },

  148: {
    unit: "kPa",
    description: "Max. toelaatbare meetonzekerheid u",
    category: "dov_calibration",
    dataType: "float",
  },

  149: {
    unit: "kPa/°C",
    description: "Omgevingstemperatuurstabiliteit u",
    category: "dov_calibration",
    dataType: "float",
  },

  150: {
    unit: "kPa/°C",
    description: "Wisselende temperatuurstabiliteit u",
    category: "dov_calibration",
    dataType: "float",
  },

  151: {
    unit: "kPa/N",
    description: "Conusbelastingsinvloed u",
    category: "dov_calibration",
    dataType: "float",
  },

  200: {
    unit: "m",
    description: "Voerbuis 1 tot",
    category: "dov_guide_tubes",
    dataType: "float",
  },

  201: {
    unit: "m",
    description: "Voerbuis 1 op",
    category: "dov_guide_tubes",
    dataType: "float",
  },

  250: {
    unit: "m",
    description: "Boring 0 van",
    category: "dov_borings",
    dataType: "float",
  },

  251: {
    unit: "m",
    description: "Boring 0 tot",
    category: "dov_borings",
    dataType: "float",
  },

  300: {
    unit: "m",
    description: "Optrekking 1",
    category: "dov_retractions",
    dataType: "float",
  },

  350: {
    unit: "m",
    description: "Stopzetting 1",
    category: "dov_stops",
    dataType: "float",
  },

  351: {
    unit: "m",
    description: "Stopzetting 2",
    category: "dov_stops",
    dataType: "float",
  },

  352: {
    unit: "m",
    description: "Stopzetting 3",
    category: "dov_stops",
    dataType: "float",
  },

  353: {
    unit: "m",
    description: "Stopzetting 4",
    category: "dov_stops",
    dataType: "float",
  },

  354: {
    unit: "m",
    description: "Stopzetting 5",
    category: "dov_stops",
    dataType: "float",
  },
};
