import { processCommonFields, type GEFHeadersMap } from "./gef-common.js";
import type {
  ProcessedMeasurement,
  ProcessedMetadata,
  ProcessedText,
} from "./gef-common.js";
import {
  getMeasurementTextKey,
  getMeasurementVarKey,
} from "./gef-measurement-mappings.js";
import {
  parseGefBoreHeaders,
  type GefBoreHeaders,
  type SpecimenText,
  type SpecimenVar,
} from "./gef-schemas.js";
import { BORE_LAYER_QUANTITY } from "./gef-bore-codes.js";
import { z } from "zod";
import {
  boreMeasurementTextVariables,
  boreMeasurementVariables,
} from "./gef-bore-spec.js";

export interface GefBoreData {
  fileType: "BORE";
  layers: Array<BoreLayer>;
  specimens: Array<BoreSpecimen>;
  headers: GefBoreHeaders;
  warnings: Array<string>;
  processed: ProcessedMetadata;
}

export interface StandardizedCode {
  description: string;
  descriptionNl: string;
  code: string;
}

export function findBoreMeasurementVariable(id: number) {
  return boreMeasurementVariables[id];
}

function findBoreMeasurementTextVariable(id: number) {
  return boreMeasurementTextVariables[id];
}

/**
 * Decode a standardized code for a BORE measurement text variable
 */
function decodeBoreMeasurementText(id: number, text: string): string {
  const variable = findBoreMeasurementTextVariable(id);

  if (!variable?.standardizedCodes) {
    return text;
  }

  const code = variable.standardizedCodes.find(
    (c) => c.code.toLowerCase() === text.trim().toLowerCase(),
  );

  if (code) {
    return `${code.description} (${code.code})`;
  }

  return text;
}

// =============================================================================
// BORE Metadata Processing
// =============================================================================

/**
 * Process BORE-specific metadata (MEASUREMENTVAR, MEASUREMENTTEXT)
 * BORE files use different ID schemes than CPT files
 */
export function processBoreMetadata(
  filename: string,
  headers: GefBoreHeaders,
): ProcessedMetadata {
  const common = processCommonFields(filename, "BORE", headers);

  return {
    ...common,
    measurements: processBoreMeasurementVar(headers.MEASUREMENTVAR),
    texts: processBoreMeasurementText(headers.MEASUREMENTTEXT),
  };
}

// =============================================================================
// Soil Colors and Types
// =============================================================================

// Soil type colors based on NEN 5104 main classifications
export const SOIL_COLORS: Record<string, string> = {
  // Gravel (Grind)
  G: "#D4A574", // tan/brown
  Gf: "#D4A574",
  Gm: "#C4956A",
  Gz: "#E4B584",

  // Sand (Zand)
  Z: "#FFE4A8", // yellow
  Zs1: "#FFE4A8",
  Zs2: "#FFD488",
  Zs3: "#FFC468",
  Zs4: "#FFB448",
  Zg1: "#FFE4A8",
  Zg2: "#FFD488",
  Zg3: "#FFC468",
  Zk1: "#FFECA8",
  Zk2: "#FFDC88",
  Zk3: "#FFCC68",

  // Silt (Leem)
  L: "#98D8C8", // greenish
  Ls1: "#98D8C8",
  Ls2: "#88C8B8",
  Ls3: "#78B8A8",
  Lz1: "#A8E8D8",
  Lz2: "#88C8B8",
  Lz3: "#68A898",

  // Clay (Klei)
  K: "#8B7355", // brown
  Ks1: "#8B7355",
  Ks2: "#7B6345",
  Ks3: "#6B5335",
  Kz1: "#9B8365",
  Kz2: "#8B7355",
  Kz3: "#7B6345",
  Kz1g1: "#9B8365",
  Kz1g2: "#8B7355",
  Kz2g1: "#7B6345",
  Kz2g2: "#6B5335",
  Kz3g1: "#5B4325",
  Kz3g2: "#4B3315",

  // Peat (Veen)
  V: "#4A3728", // dark brown
  Vk1: "#5A4738",
  Vk2: "#4A3728",
  Vk3: "#3A2718",
  Vz1: "#5A4738",
  Vz2: "#4A3728",
  Vz3: "#3A2718",
  Vh1: "#6A5748",
  Vh2: "#5A4738",
  Vh3: "#4A3728",

  // Anthropogenic (Made ground)
  NBE: "#808080", // gray - niet beschreven (not described)

  // Default
  default: "#CCCCCC",
};

function processBoreMeasurementVar(
  MEASUREMENTVAR:
    | Array<{
        id: number;
        value: number | undefined;
        unit: string;
        description: string;
      }>
    | undefined,
) {
  const measurements: Record<string, ProcessedMeasurement> = {};

  if (MEASUREMENTVAR) {
    for (const mv of MEASUREMENTVAR) {
      const varInfo = boreMeasurementVariables[mv.id];
      if (!varInfo) {
        continue;
      }

      // Skip if value is undefined (missing value indicated by "-" in GEF file)
      if (mv.value === undefined) {
        continue;
      }

      const measurementVarKey = getMeasurementVarKey(
        mv.id,
        boreMeasurementVariables,
      );

      if (measurementVarKey) {
        measurements[measurementVarKey] = {
          value: mv.value,
          unit: mv.unit,
          metadata: {
            id: mv.id,
            category: varInfo.category,
            description: varInfo.description,
          },
        };
      }
    }
  }
  return measurements;
}

function processBoreMeasurementText(
  MEASUREMENTTEXT:
    | Array<{
        id: number;
        text: string;
        extra: Array<string>;
      }>
    | undefined,
) {
  // Process all MEASUREMENTTEXT values using BORE-specific metadata
  const texts: Record<string, ProcessedText> = {};

  if (MEASUREMENTTEXT) {
    for (const mt of MEASUREMENTTEXT) {
      const textInfo = boreMeasurementTextVariables[mt.id];
      if (!textInfo) {
        continue;
      }

      const measurementVarKey = getMeasurementTextKey(
        mt.id,
        boreMeasurementTextVariables,
      );

      if (measurementVarKey) {
        const decoded = decodeBoreMeasurementText(mt.id, mt.text);
        texts[measurementVarKey] = {
          value: mt.text,
          decoded: decoded !== mt.text ? decoded : undefined,
          metadata: {
            id: mt.id,
            category: textInfo.category,
            description: textInfo.description,
            required: textInfo.required,
          },
        };
      }
    }
  }

  return texts;
}

export function getSoilColor(code: string): string {
  // First try exact match
  if (SOIL_COLORS[code]) {
    return SOIL_COLORS[code];
  }

  // Try matching main soil type (first character(s))
  const prefixes = [
    "Kz3g",
    "Kz2g",
    "Kz1g",
    "Kz",
    "Ks",
    "Vk",
    "Vz",
    "Vh",
    "Zs",
    "Zg",
    "Zk",
    "Ls",
    "Lz",
    "Gf",
    "Gm",
    "Gz",
    "K",
    "V",
    "Z",
    "L",
    "G",
  ];

  for (const prefix of prefixes) {
    if (code.startsWith(prefix)) {
      // Find a matching color
      const matchingKey = Object.keys(SOIL_COLORS).find((k) =>
        k.startsWith(prefix),
      );
      if (matchingKey && SOIL_COLORS[matchingKey]) {
        return SOIL_COLORS[matchingKey];
      }
    }
  }

  return SOIL_COLORS.default ?? "#CCCCCC";
}

// Bore layer data structure
export interface BoreLayer {
  depthTop: number;
  depthBottom: number;
  soilCode: string;
  additionalCodes: Array<string>;
  description?: string;
  // Numeric properties (may be null/void)
  sandMedian?: number | null;
  gravelMedian?: number | null;
  clayPercent?: number | null;
  siltPercent?: number | null;
  sandPercent?: number | null;
  gravelPercent?: number | null;
  organicPercent?: number | null;
}

/**
 * Format a specimen code by looking it up in the provided code list
 * Returns the description in the specified language if found, the original code if not in list, or undefined if code is undefined
 */
export function formatSpecimenCode(
  code: string | undefined,
  codeList: ReadonlyArray<{ code: string; nl: string; en: string }>,
  language: "nl" | "en" = "nl",
): string | undefined {
  if (!code) {
    return undefined;
  }
  const found = codeList.find((c) => c.code === code);
  return found ? found[language] : code;
}

// Specimen data structure for bore files
export interface BoreSpecimen {
  specimenNumber: number; // k (1-200)
  depthTop: number;
  depthBottom: number;
  // Numerical properties from SPECIMENVAR
  diameterMonster?: number | null;
  diameterMonstersteekapparaat?: number | null;
  // Text properties from SPECIMENTEXT
  monstercode?: string;
  monsterdatum?: string;
  monstertijd?: string;
  geroerdOngeroerd?: string;
  monstersteekapparaat?: string;
  dikDunwandig?: string;
  monstermethode?: string;
  // Remarks (SPECIMENTEXT 1-5)
  remarks?: Array<string>;
}

// N + Offsets for SPECIMENVAR IDs
const specimenVarOffsets = {
  depthTop: 4,
  depthBottom: 5,
  diameterMonster: 6,
  diameterMonstersteekapparaat: 7,
} as const;

// Helper to calculate SPECIMENVAR ID for a given specimen number k
function getSpecimenVarId(
  k: number,
  property: keyof typeof specimenVarOffsets,
): number {
  return specimenVarOffsets[property] + 7 * k;
}

// N + Offsets for SPECIMENTEXT IDs
const specimentTextOffsets = {
  monstercode: 4,
  monsterdatum: 5,
  monstertijd: 6,
  geroerdOngeroerd: 7,
  monstersteekapparaat: 8,
  dikDunwandig: 9,
  monstermethode: 10,
} as const;

// Helper to calculate SPECIMENTEXT ID for a given specimen number k
function getSpecimenTextId(
  k: number,
  property: keyof typeof specimentTextOffsets,
): number {
  return specimentTextOffsets[property] + 7 * k;
}

export function parseGefBoreData(
  dataString: string,
  headersMap: GEFHeadersMap,
): {
  layers: Array<BoreLayer>;
  headers: GefBoreHeaders;
  warnings: Array<string>;
} {
  const headers = parseGefBoreHeaders(headersMap);
  const columnSeparator = headers.COLUMNSEPARATOR ?? ";";
  const columnInfo = headers.COLUMNINFO ?? [];
  const warnings: Array<string> = [];

  // Per GEF spec: default record separator is CR/LF
  // Handle both \r\n (CR/LF) and \n (LF) for cross-platform compatibility
  const recordSeparator = headers.RECORDSEPARATOR ?? /\r?\n/;
  const records = dataString
    .split(recordSeparator)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  // Track line numbers for better error messages
  const recordLineNumbers: Array<number> = [];
  let currentLine = 1;
  for (const record of records) {
    recordLineNumbers.push(currentLine);
    // Count newlines in this record to track line progression
    currentLine += (record.match(/\n/g) ?? []).length + 1;
  }

  const voidValuesMap = new Map(
    headers.COLUMNVOID?.map(({ columnNumber, voidValue }) => [
      columnNumber,
      voidValue,
    ]) ?? [],
  );

  const layers: Array<BoreLayer> = records.map((record, recordIndex) => {
    const lineNumber = recordLineNumbers[recordIndex];
    const parts = record
      .split(columnSeparator)
      .map((p) => p.trim())
      .filter((p) => p !== "");

    // Parse numeric columns (first N columns based on COLUMNINFO) with Zod validation
    const columnValues = parts.slice(0, columnInfo.length).map((val, index) => {
      // Try to parse as number using Zod
      const result = z.coerce.number().safeParse(val);

      if (!result.success) {
        // Collect warning for invalid value
        const colName = columnInfo[index]?.name ?? `column ${index + 1}`;
        warnings.push(
          `Line ${lineNumber}, record ${
            recordIndex + 1
          }, ${colName}: invalid number "${val}" - setting to null`,
        );
        return null;
      }

      // Check if this is a void value
      const voidValue = voidValuesMap.get(index + 1);
      if (result.data === voidValue) {
        return null;
      }

      return result.data;
    });

    // Parse text columns (remaining parts, strip quotes)
    const textParts = parts
      .slice(columnInfo.length)
      .map((t) => t.replace(/^'|'$/g, "").trim())
      .filter((t) => t.length > 0);

    // Helper to find column value by quantity number
    const getValueByQuantity = (quantityNumber: number): number | null => {
      const idx = columnInfo.findIndex(
        (c) => c.quantityNumber === quantityNumber,
      );
      return idx >= 0 ? (columnValues[idx] ?? null) : null;
    };

    // Find required depth columns by quantity number
    const depthTopIdx = columnInfo.findIndex(
      (c) =>
        c.quantityNumber === BORE_LAYER_QUANTITY.DEPTH_TOP ||
        c.name.toLowerCase().includes("bovenkant"),
    );
    const depthBottomIdx = columnInfo.findIndex(
      (c) =>
        c.quantityNumber === BORE_LAYER_QUANTITY.DEPTH_BOTTOM ||
        c.name.toLowerCase().includes("onderkant"),
    );

    // Default to columns 0 and 1 if not found
    const depthTop = columnValues[depthTopIdx >= 0 ? depthTopIdx : 0] ?? 0;
    const depthBottom =
      columnValues[depthBottomIdx >= 0 ? depthBottomIdx : 1] ?? 0;

    // First text part is the main soil code
    const soilCode = textParts[0] ?? "";
    const additionalCodes = textParts.slice(1);

    // Check if last additional code is a description (not a standard code)
    let description: string | undefined;
    if (additionalCodes.length > 0) {
      const lastCode = additionalCodes[additionalCodes.length - 1];
      // If it contains spaces or is longer than typical codes, treat as description
      if (lastCode && (lastCode.includes(" ") || lastCode.length > 10)) {
        description = additionalCodes.pop();
      }
    }

    return {
      depthTop,
      depthBottom,
      soilCode,
      additionalCodes,
      description,
      // Optional layer characteristics - use quantity numbers from Table 2.18
      clayPercent: getValueByQuantity(BORE_LAYER_QUANTITY.CLAY_PERCENT),
      siltPercent: getValueByQuantity(BORE_LAYER_QUANTITY.SILT_PERCENT),
      sandPercent: getValueByQuantity(BORE_LAYER_QUANTITY.SAND_PERCENT),
      gravelPercent: getValueByQuantity(BORE_LAYER_QUANTITY.GRAVEL_PERCENT),
      organicPercent: getValueByQuantity(BORE_LAYER_QUANTITY.ORGANIC_PERCENT),
      sandMedian: getValueByQuantity(BORE_LAYER_QUANTITY.SAND_MEDIAN),
      gravelMedian: getValueByQuantity(BORE_LAYER_QUANTITY.GRAVEL_MEDIAN),
    };
  });

  const validLayers = layers.filter((layer, index) => {
    const lineNumber = recordLineNumbers[index];

    // Check for NaN in depth values
    if (Number.isNaN(layer.depthTop) || Number.isNaN(layer.depthBottom)) {
      warnings.push(
        `Line ${lineNumber}, record ${index + 1}: invalid depth values (top: ${
          layer.depthTop
        }, bottom: ${layer.depthBottom}) - skipping layer`,
      );
      return false;
    }

    // Check for inverted depth values
    if (layer.depthBottom < layer.depthTop) {
      warnings.push(
        `Line ${lineNumber}, record ${index + 1}: depth bottom (${
          layer.depthBottom
        }m) is less than depth top (${layer.depthTop}m) - skipping layer`,
      );
      return false;
    }

    return true;
  });

  return { layers: validLayers, headers, warnings };
}

export function parseGefBoreSpecimens(
  headers: GefBoreHeaders,
): Array<BoreSpecimen> {
  const specimenVars = headers.SPECIMENVAR ?? [];
  const specimenTexts = headers.SPECIMENTEXT ?? [];

  // Get number of specimens from SPECIMENVAR id=1
  const countVar = specimenVars.find((v) => v.id === 1);
  const specimenCount =
    countVar?.value !== undefined ? Math.floor(countVar.value) : 0;

  if (specimenCount === 0) {
    return [];
  }

  const varMap = new Map<number, SpecimenVar>();
  for (const v of specimenVars) {
    varMap.set(v.id, v);
  }

  const textMap = new Map<number, SpecimenText>();
  for (const t of specimenTexts) {
    textMap.set(t.id, t);
  }

  // SPECIMENTEXT ids 1-5 are reserved for general remarks (apply to all specimens)
  const remarks = Array.from(
    { length: 5 },
    (_, i) => textMap.get(i + 1)?.text,
  ).filter((d): d is string => Boolean(d));

  const specimens: Array<BoreSpecimen> = [];

  for (let k = 1; k <= specimenCount; k++) {
    const depthTopVar = varMap.get(getSpecimenVarId(k, "depthTop"));
    const depthBottomVar = varMap.get(getSpecimenVarId(k, "depthBottom"));
    const diameterMonsterVar = varMap.get(
      getSpecimenVarId(k, "diameterMonster"),
    );
    const diameterApparaatVar = varMap.get(
      getSpecimenVarId(k, "diameterMonstersteekapparaat"),
    );

    const monstercodeText = textMap.get(getSpecimenTextId(k, "monstercode"));
    const monsterdatumText = textMap.get(getSpecimenTextId(k, "monsterdatum"));
    const monstertijdText = textMap.get(getSpecimenTextId(k, "monstertijd"));
    const geroerdText = textMap.get(getSpecimenTextId(k, "geroerdOngeroerd"));
    const monstersteekapparaatText = textMap.get(
      getSpecimenTextId(k, "monstersteekapparaat"),
    );
    const dikDunwandigText = textMap.get(getSpecimenTextId(k, "dikDunwandig"));
    const monstermethodeText = textMap.get(
      getSpecimenTextId(k, "monstermethode"),
    );

    const specimen: BoreSpecimen = {
      specimenNumber: k,
      depthTop: depthTopVar?.value ?? 0,
      depthBottom: depthBottomVar?.value ?? 0,
      diameterMonster: diameterMonsterVar?.value ?? null,
      diameterMonstersteekapparaat: diameterApparaatVar?.value ?? null,
      monstercode: monstercodeText?.text,
      monsterdatum: monsterdatumText?.text,
      monstertijd: monstertijdText?.text,
      geroerdOngeroerd: geroerdText?.text,
      monstersteekapparaat: monstersteekapparaatText?.text,
      dikDunwandig: dikDunwandigText?.text,
      monstermethode: monstermethodeText?.text,
      // General remarks (SPECIMENTEXT 1-5) included in all specimens
      remarks: remarks.length > 0 ? remarks : undefined,
    };

    specimens.push(specimen);
  }

  return specimens;
}
