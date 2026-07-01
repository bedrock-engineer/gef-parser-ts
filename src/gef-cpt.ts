import { addComputedDepthColumns, type CptRow } from "./depth-correction.js";
import {
  buildColumnMap,
  checkDuplicateQuantities,
  parseGefRecords,
  processCommonFields,
  ProcessedMeasurement,
  ProcessedText,
  type GEFHeadersMap,
  type ProcessedCptMetadata,
} from "./gef-common.js";
import {
  cptColumnQuantities,
  cptMeasurementTextVariables,
  cptMeasurementVariables,
  broMeasurementTextVariables,
  broMeasurementVariables,
  belgianMeasurementTextVariables,
  belgianMeasurementVariables,
  klasse1MeasurementTextVariables,
  klasse1MeasurementVariables,
  votbMeasurementTextVariables,
  votbMeasurementVariables,
} from "./gef-cpt-spec.js";
import {
  getMeasurementTextKey,
  getMeasurementVarKey,
} from "./gef-measurement-mappings.js";
import {
  parseGefCptHeaders,
  SpecimenVar,
  type ColumnInfo,
  type GefCptHeaders,
} from "./gef-schemas.js";
import type { GefWarning } from "./gef-warnings.js";

export type GefExtension = "standard" | "bro" | "belgian" | "klasse1" | "votb";

// Pre-excavation layer for CPT files
// Describes soil that was removed before cone penetration testing
export interface PreExcavationLayer {
  depthTop: number; // Top of layer (m)
  depthBottom: number; // Bottom of layer (m) - from SPECIMENVAR value
  description: string; // Soil description
  unit: string; // Soil description
}

export interface GefCptData {
  fileType: "CPT";
  data: Array<CptRow>;
  headers: GefCptHeaders;
  columnInfo: Array<ColumnInfo>;
  warnings: Array<GefWarning>;
  processed: ProcessedCptMetadata;
}

export function processCptMetadata(
  filename: string,
  headers: GefCptHeaders,
  columnInfo: Array<ColumnInfo>,
): ProcessedCptMetadata {
  const common = processCommonFields(filename, "CPT", headers);

  // Detect if this is a Belgian (DOV) or Dutch (BRO/VOTB) extension
  const extension = detectGefExtension(
    headers.MEASUREMENTTEXT?.map((mt) => mt.id),
    headers.MEASUREMENTVAR?.map((mv) => mv.id),
  );

  const measurementVarMetadata =
    getCptMeasurementVariablesForExtension(extension);

  const measurementTextMetadata =
    getCptMeasurementTextVariablesForExtension(extension);

  // Process all MEASUREMENTVAR values into human-readable format with metadata
  const measurements: Record<string, ProcessedMeasurement> = {};
  if (headers.MEASUREMENTVAR) {
    for (const mv of headers.MEASUREMENTVAR) {
      const varInfo =
        measurementVarMetadata[mv.id as keyof typeof measurementVarMetadata];

      // `as` assertion gives false security here
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!varInfo) {
        continue;
      }

      // Skip if value is undefined (missing value indicated by "-" in GEF file)
      if (mv.value === undefined) {
        continue;
      }

      const key = getMeasurementVarKey(mv.id, measurementVarMetadata);

      if (key) {
        measurements[key] = {
          value: mv.value,
          unit: mv.unit,
          metadata: {
            id: mv.id,
            category: varInfo.category,
            description: varInfo.description,
            descriptionNl:
              "descriptionNl" in varInfo
                ? (varInfo as { descriptionNl?: string }).descriptionNl
                : undefined,
            required:
              "required" in varInfo
                ? (varInfo as { required?: boolean }).required
                : undefined,
          },
        };
      }
    }
  }

  // Process all MEASUREMENTTEXT values into human-readable format with metadata
  const texts: Record<string, ProcessedText> = {};
  if (headers.MEASUREMENTTEXT) {
    for (const mt of headers.MEASUREMENTTEXT) {
      const textInfo =
        measurementTextMetadata[mt.id as keyof typeof measurementTextMetadata];

      // `as` assertion gives false security here
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!textInfo) {
        continue;
      }

      const measurementTextKey = getMeasurementTextKey(
        mt.id,
        measurementTextMetadata,
      );
      if (measurementTextKey) {
        const decoded = decodeMeasurementText(mt.id, mt.text, extension);

        texts[measurementTextKey] = {
          value: mt.text,
          decoded: decoded !== mt.text ? decoded : undefined,
          metadata: {
            id: mt.id,
            category: textInfo.category,
            description: textInfo.description,
            descriptionNl:
              "descriptionNl" in textInfo
                ? (textInfo as { descriptionNl?: string }).descriptionNl
                : undefined,
            required:
              "required" in textInfo
                ? (textInfo as { required?: boolean }).required
                : undefined,
          },
        };
      }
    }
  }

  return {
    ...common,
    fileType: "CPT",
    extension,
    columns: buildColumnMap(columnInfo, cptColumnQuantities),
    preExcavationLayers: parsePreExcavationLayers(headers),
    children: headers.CHILD ?? [],
    measurements,
    texts,
  };
}

// Parse pre-excavation layers from SPECIMENVAR in CPT files
// Per spec: value is bottom depth, description is soil type
// Layers are ordered by ID (1, 2, 3...) with each value being the cumulative depth
export function parsePreExcavationLayers(
  headers: GefCptHeaders,
): Array<PreExcavationLayer> {
  const specimenVars = headers.SPECIMENVAR ?? [];

  if (specimenVars.length === 0) {
    return [];
  }

  // Filter out layers with missing values and sort by ID to ensure correct order
  const sorted = [...specimenVars]
    .filter(
      (sv): sv is SpecimenVar & { value: number } => sv.value !== undefined,
    )
    .sort((a, b) => a.id - b.id);

  const layers: Array<PreExcavationLayer> = [];
  let previousDepth = 0;

  for (const layer of sorted) {
    // Type assertion safe here because we filtered out undefined values above
    const depthBottom = layer.value;
    layers.push({
      depthTop: previousDepth,
      depthBottom: depthBottom,
      description: layer.description,
      unit: layer.unit,
    });
    previousDepth = depthBottom;
  }

  return layers;
}

export type Unit =
  | "m"
  | "MPa"
  | "%"
  | "degrees"
  | "kN/m³"
  | "S/m"
  | "nT"
  | "°C"
  | "s"
  | "-";

/**
 * Detect which GEF extension is used based on file headers
 */
export function detectGefExtension(
  measurementTextIds?: Array<number>,
  measurementVarIds?: Array<number>,
): GefExtension {
  const textIds = measurementTextIds ?? [];
  const varIds = measurementVarIds ?? [];

  // Dutch BRO fields (101-128) or VOTB fields (1100+)
  const hasDutchTextIds = textIds.some(
    (id) => (id >= 101 && id <= 128) || id >= 1100,
  );
  const hasDutchVarIds = varIds.some(
    (id) => (id >= 101 && id <= 130) || id >= 1100,
  );
  if (hasDutchTextIds || hasDutchVarIds) {
    return "bro";
  }

  // Belgian DOV fields: MEASUREMENTTEXT (135-144), MEASUREMENTVAR (130-354)
  const hasBelgianTextIds = textIds.some((id) => id >= 135 && id <= 144);
  const hasBelgianVarIds = varIds.some(
    (id) => (id >= 130 && id <= 158) || (id >= 200 && id <= 354),
  );
  if (hasBelgianTextIds || hasBelgianVarIds) {
    return "belgian";
  }

  return "standard";
}

const CPT_QUANTITY = {
  LENGTH: 1,
  CONE_RESISTANCE: 2,
  CORRECTED_DEPTH: 11,
  CORRECTED_CONE_RESISTANCE: 13,
} as const;

/**
 * Get CPT measurement text variables for a given extension
 */
function getCptMeasurementTextVariablesForExtension(extension: GefExtension) {
  if (extension === "bro") {
    return { ...cptMeasurementTextVariables, ...broMeasurementTextVariables };
  }
  if (extension === "klasse1") {
    return {
      ...cptMeasurementTextVariables,
      ...klasse1MeasurementTextVariables,
    };
  }
  if (extension === "votb") {
    return { ...cptMeasurementTextVariables, ...votbMeasurementTextVariables };
  }
  if (extension === "belgian") {
    return {
      ...cptMeasurementTextVariables,
      ...belgianMeasurementTextVariables,
    };
  }

  return cptMeasurementTextVariables;
}

/**
 * Get CPT measurement variables for a given extension
 */
function getCptMeasurementVariablesForExtension(extension: GefExtension) {
  if (extension === "bro") {
    return { ...cptMeasurementVariables, ...broMeasurementVariables };
  }
  if (extension === "klasse1") {
    return { ...cptMeasurementVariables, ...klasse1MeasurementVariables };
  }
  if (extension === "votb") {
    return { ...cptMeasurementVariables, ...votbMeasurementVariables };
  }
  if (extension === "belgian") {
    return { ...cptMeasurementVariables, ...belgianMeasurementVariables };
  }

  return cptMeasurementVariables;
}

/**
 * Find a CPT measurement text variable by ID, considering the extension
 */
function findCptMeasurementTextVariable(id: number, extension: GefExtension) {
  const variables = getCptMeasurementTextVariablesForExtension(extension);
  return variables[id as keyof typeof variables];
}

/**
 * Find a CPT measurement variable by ID, considering the extension
 */
export function findCptMeasurementVariable(
  id: number,
  extension: GefExtension,
) {
  const variables = getCptMeasurementVariablesForExtension(extension);
  // Indexing by an arbitrary id can miss; the lookup is genuinely optional.
  return variables[id as keyof typeof variables] as
    | (typeof variables)[keyof typeof variables]
    | undefined;
}

/**
 * Decode a standardized code for a CPT measurement text variable
 * Returns formatted string like "Measured, surveying (MMET)" or the original text if no match
 */
function decodeMeasurementText(
  id: number,
  text: string,
  extension: GefExtension = "standard",
): string {
  const variable = findCptMeasurementTextVariable(id, extension);
  // as assertion gives false security here
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!variable || !("standardizedCodes" in variable)) {
    return text;
  }

  const standardizedCodes = variable.standardizedCodes;

  const code = standardizedCodes.find(
    (c: { code: string; description: string }) =>
      c.code === text.trim().toUpperCase(),
  );
  if (code) {
    return `${code.description} (${code.code})`;
  }

  return text;
}

export function parseGefCptData(dataString: string, headersMap: GEFHeadersMap) {
  const headers = parseGefCptHeaders(headersMap);

  const columnSeparator = headers.COLUMNSEPARATOR ?? /\s+/;
  // Per GEF spec: default record separator is CR/LF
  // Handle both \r\n (CR/LF) and \n (LF) for cross-platform compatibility
  const recordSeparator = headers.RECORDSEPARATOR ?? /\r?\n/;
  const columnInfo = headers.COLUMNINFO ?? [];

  // Check if text column is allowed in data block (per GEF spec)
  const hasTextColumn = headers.COLUMNTEXT?.[0] !== undefined;

  // Create void values map from parsed COLUMNVOID
  const voidValuesMap = new Map(
    headers.COLUMNVOID?.map(({ columnNumber, voidValue }) => [
      columnNumber,
      voidValue,
    ]) ?? [],
  );

  // Find all depth columns (for normalization), some GEF files incorrectly use negative depths
  const depthColumnNumbers = new Set<number>();

  // Add standard depth quantity numbers
  const depthQuantities = new Set([
    CPT_QUANTITY.LENGTH, // length
    CPT_QUANTITY.CORRECTED_DEPTH,
  ]);
  for (const col of columnInfo) {
    if (depthQuantities.has(col.quantityNumber as never)) {
      depthColumnNumbers.add(col.colNum);
    }
  }

  // Fallback: also check by keywords if no quantity numbers found
  if (depthColumnNumbers.size === 0) {
    for (const col of columnInfo) {
      const nameLower = col.name.toLowerCase();
      if (
        col.unit === "m" &&
        DEPTH_KEYWORDS.some((kw) => nameLower.includes(kw))
      ) {
        depthColumnNumbers.add(col.colNum);
      }
    }
  }

  const { rows: normalizedRows, warnings } = parseGefRecords(dataString, {
    columnSeparator,
    recordSeparator,
    columnInfo,
    voidValues: voidValuesMap,
    hasTextColumn,
    absoluteValueColumns: depthColumnNumbers,
  });

  // Add computed depth columns (trueDepth, elevation)
  const dataWithComputedColumns = addComputedDepthColumns(
    normalizedRows as Array<Record<string, number>>,
    columnInfo,
    headers.ZID,
    headers.MEASUREMENTVAR,
  );

  return {
    data: dataWithComputedColumns,
    headers,
    columnInfo,
    warnings,
  };
}

export function generateCptWarnings(
  filename: string,
  headers: GefCptHeaders,
  data?: Array<CptRow>,
): Array<GefWarning> {
  const warnings: Array<GefWarning> = [];

  if (!headers.COLUMNINFO) {
    return warnings;
  }

  const columnInfo = headers.COLUMNINFO;

  warnings.push(
    ...checkDuplicateQuantities(filename, columnInfo, cptColumnQuantities),
  );

  // Check for required parameters (per GEF-CPT spec)
  const hasLength = columnInfo.some(
    (col) => col.quantityNumber === CPT_QUANTITY.LENGTH,
  );
  const hasConeResistance = columnInfo.some(
    (col) => col.quantityNumber === CPT_QUANTITY.CONE_RESISTANCE,
  );

  if (!hasLength) {
    warnings.push({
      type: "missingRequiredColumn",
      filename,
      quantityNumber: CPT_QUANTITY.LENGTH,
      quantityName: "Penetration length",
    });
  }
  if (!hasConeResistance) {
    warnings.push({
      type: "missingRequiredColumn",
      filename,
      quantityNumber: CPT_QUANTITY.CONE_RESISTANCE,
      quantityName: "Cone resistance",
    });
  }

  warnings.push(
    ...checkColumnMinMax(headers.COLUMNMINMAX, data, columnInfo, filename),
  );

  return warnings;
}

// Validate COLUMNMINMAX bounds if present
function checkColumnMinMax(
  columnMinMax: GefCptHeaders["COLUMNMINMAX"],
  data: Array<CptRow> | undefined,
  columnInfo: Array<ColumnInfo>,
  filename: string,
): Array<GefWarning> {
  const warnings: Array<GefWarning> = [];
  if (columnMinMax && data && data.length > 0) {
    for (const { columnNumber, min, max } of columnMinMax) {
      const colInfo = columnInfo.find((c) => c.colNum === columnNumber);
      if (!colInfo) {
        continue;
      }

      const values = data
        .map((row) => row[colInfo.name])
        .filter((v): v is number => v !== undefined);

      if (values.length === 0) {
        continue;
      }

      const actualMin = Math.min(...values);
      const actualMax = Math.max(...values);

      if (actualMin < min || actualMax > max) {
        warnings.push({
          type: "columnMinMaxExceeded",
          filename,
          columnNumber,
          columnName: colInfo.name,
          actualMin,
          actualMax,
          declaredMin: min,
          declaredMax: max,
        });
      }
    }
  }
  return warnings;
}

/**
 * Find column by quantity number
 */
export function findColumnByQuantity(
  columns: Array<ColumnInfo>,
  quantityNumber: number,
): ColumnInfo | undefined {
  return columns.find((col) => col.quantityNumber === quantityNumber);
}

const DEPTH_KEYWORDS = [
  "penetration",
  "sondeer",
  "length",
  "diepte",
  "lengte",
];
