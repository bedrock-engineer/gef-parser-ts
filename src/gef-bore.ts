import { z } from "zod";
import {
  BORE_LAYER_QUANTITY,
  decodeBoreCode,
  parseSoilCode,
  type SoilCode,
} from "./gef-bore-codes.js";
import {
  boreMeasurementTextVariables,
  boreMeasurementVariables,
  SpecimenCode,
} from "./gef-bore-spec.js";
import type {
  ProcessedBoreMetadata,
  ProcessedMeasurement,
  ProcessedText,
} from "./gef-common.js";
import { processCommonFields, type GEFHeadersMap } from "./gef-common.js";
import {
  getMeasurementTextKey,
  getMeasurementVarKey,
} from "./gef-measurement-mappings.js";
import {
  MeasurementText,
  MeasurementVar,
  parseGefBoreHeaders,
  type GefBoreHeaders,
  type SpecimenText,
  type SpecimenVar,
} from "./gef-schemas.js";
import type { GefWarning } from "./gef-warnings.js";

export interface GefBoreData {
  fileType: "BORE";
  layers: Array<BoreLayer>;
  headers: GefBoreHeaders;
  warnings: Array<GefWarning>;
  processed: ProcessedBoreMetadata;
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
): ProcessedBoreMetadata {
  const common = processCommonFields(filename, "BORE", headers);

  return {
    ...common,
    fileType: "BORE",
    specimens: parseGefBoreSpecimens(headers),
    measurements: processBoreMeasurementVar(headers.MEASUREMENTVAR),
    texts: processBoreMeasurementText(headers.MEASUREMENTTEXT),
  };
}

function processBoreMeasurementVar(
  MEASUREMENTVAR: Array<MeasurementVar> | undefined,
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
  MEASUREMENTTEXT: Array<MeasurementText> | undefined,
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

// Bore layer data structure
export interface BoreLayer {
  depthTop: number;
  depthBottom: number;
  soilCode: string;
  additionalCodes: Array<string>;
  /** Structured NEN 5104 decomposition of `soilCode` (main soil + graded admixtures). */
  soil: SoilCode;
  /**
   * Decoded Dutch description of the whole layer: `soilCode` plus the coded
   * `additionalCodes` (colours, layering, qualifiers). Excludes the free-text
   * driller's remark, which stays in `description`.
   */
  soilText: string;
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
 * Turn a layer's raw code strings into structure: the NEN 5104 decomposition of
 * `soilCode` (`soil`) and a decoded Dutch description of the whole layer
 * (`soilText`). `additionalCodes` should already have the free-text driller's
 * remark removed, so `soilText` decodes only recognised codes; unknown codes are
 * kept verbatim by `decodeBoreCode`. Never throws.
 */
function hydrateSoil(
  soilCode: string,
  additionalCodes: Array<string>,
): { soil: SoilCode; soilText: string } {
  const soil = parseSoilCode(soilCode);
  const soilText = [soilCode, ...additionalCodes]
    .filter((code) => code.length > 0)
    .map((code) => decodeBoreCode(code))
    .join(", ");
  return { soil, soilText };
}

/**
 * Format a specimen code by looking it up in the provided code list
 * Returns the description in the specified language if found, the original code if not in list, or undefined if code is undefined
 */
export function formatSpecimenCode(
  code: string | undefined,
  codeList: ReadonlyArray<SpecimenCode>,
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

const propertiesPerSpecimen = 7;

function getSpecimenVarId(
  k: number,
  property: keyof typeof specimenVarOffsets,
): number {
  return specimenVarOffsets[property] + propertiesPerSpecimen * k;
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

const nrOfSpecimenTextProperties = 7;

function getSpecimenTextId(
  k: number,
  property: keyof typeof specimentTextOffsets,
): number {
  return specimentTextOffsets[property] + nrOfSpecimenTextProperties * k;
}

export function parseGefBoreData(
  dataString: string,
  headersMap: GEFHeadersMap,
): {
  layers: Array<BoreLayer>;
  headers: GefBoreHeaders;
  warnings: Array<GefWarning>;
} {
  const headers = parseGefBoreHeaders(headersMap);
  const columnSeparator = headers.COLUMNSEPARATOR ?? ";";
  const columnInfo = headers.COLUMNINFO ?? [];
  const warnings: Array<GefWarning> = [];

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
    const lineNumber = recordLineNumbers[recordIndex] ?? 0;
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
        warnings.push({
          type: "invalidNumber",
          line: lineNumber,
          record: recordIndex + 1,
          column: colName,
          rawValue: val,
        });
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

    // Hydrate soil structure + decoded text from the remaining coded tokens
    // (free-text remark already popped into `description`).
    const { soil, soilText } = hydrateSoil(soilCode, additionalCodes);

    return {
      depthTop,
      depthBottom,
      soilCode,
      additionalCodes,
      soil,
      soilText,
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
    const lineNumber = recordLineNumbers[index] ?? 0;

    // Check for NaN in depth values
    if (Number.isNaN(layer.depthTop) || Number.isNaN(layer.depthBottom)) {
      warnings.push({
        type: "invalidDepth",
        line: lineNumber,
        record: index + 1,
        depthTop: layer.depthTop,
        depthBottom: layer.depthBottom,
      });
      return false;
    }

    // Check for inverted depth values
    if (layer.depthBottom < layer.depthTop) {
      warnings.push({
        type: "invertedDepth",
        line: lineNumber,
        record: index + 1,
        depthTop: layer.depthTop,
        depthBottom: layer.depthBottom,
      });
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
