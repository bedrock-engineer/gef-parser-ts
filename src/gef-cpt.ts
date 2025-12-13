import { z } from "zod";
import { addComputedDepthColumns, type Row } from "./depth-correction.js";
import {
  processCommonFields,
  ProcessedMeasurement,
  ProcessedMetadata,
  ProcessedText,
  type GEFHeadersMap,
} from "./gef-common.js";
import {
  getMeasurementTextKey,
  getMeasurementVarKey,
} from "./gef-measurement-mappings.js";
import {
  parseGefCptHeaders,
  type ColumnInfo,
  type GefCptHeaders,
} from "./gef-schemas.js";
import {
  cptMeasurementVariables,
  cptMeasurementTextVariables,
  cptColumnQuantities,
  belgianMeasurementTextVariables,
  belgianMeasurementVariables,
  dutchMeasurementTextVariables,
  dutchMeasurementVariables,
} from "./gef-cpt-spec.js";

export type GefExtension = "standard" | "dutch" | "belgian";

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
  data: Array<Row>;
  headers: GefCptHeaders;
  columnInfo: Array<ColumnInfo>;
  preExcavationLayers: Array<PreExcavationLayer>;
  warnings: Array<string>;
  processed: ProcessedMetadata;
}

export function processCptMetadata(
  filename: string,
  headers: GefCptHeaders,
): ProcessedMetadata {
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
    .filter((sv) => sv.value !== undefined)
    .sort((a, b) => a.id - b.id);

  const layers: Array<PreExcavationLayer> = [];
  let previousDepth = 0;

  for (const layer of sorted) {
    // Type assertion safe here because we filtered out undefined values above
    const depthBottom = layer.value as number;
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
    return "dutch";
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
  if (extension === "dutch") {
    return { ...cptMeasurementTextVariables, ...dutchMeasurementTextVariables };
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
  if (extension === "dutch") {
    return { ...cptMeasurementVariables, ...dutchMeasurementVariables };
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
  return variables[id as keyof typeof variables];
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
  const warnings: Array<string> = [];

  // Check if text column is allowed in data block (per GEF spec)
  const columnText = headers.COLUMNTEXT?.[0]; // Typically only one text column
  const hasTextColumn = columnText !== undefined;

  // Split by record separator first (like BORE parser does)
  const records = dataString
    .split(recordSeparator)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  // Track line numbers for better error messages
  const recordLineNumbers: Array<number> = [];
  let currentLine = 1;
  for (const record of records) {
    recordLineNumbers.push(currentLine);
    currentLine += (record.match(/\n/g) ?? []).length + 1;
  }

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

  const normalizedRows = records.map((record, recordIndex) => {
    const lineNumber = recordLineNumbers[recordIndex];
    const rawValues = record
      .trim()
      .split(columnSeparator)
      .filter((val) => val.trim() !== "");

    // Build row object directly with column names
    const row: Record<string, number | string | null | undefined> = {};

    // Parse numeric columns
    for (let colIndex = 0; colIndex < columnInfo.length; colIndex++) {
      const val = rawValues[colIndex];
      const col = columnInfo[colIndex];
      const colName = col?.name ?? `column ${colIndex + 1}`;

      if (!val) {
        row[colName] = null;
        continue;
      }

      const trimmed = val.trim();

      const result = z.coerce.number().safeParse(trimmed);

      if (!result.success) {
        // Collect warning for invalid value
        warnings.push(
          `Line ${lineNumber}, record ${
            recordIndex + 1
          }, ${colName}: invalid number "${trimmed}" - setting to null`,
        );
        row[colName] = null;
        continue;
      }

      // Check if this is a void value
      const voidValue = voidValuesMap.get(colIndex + 1);
      if (result.data === voidValue) {
        row[colName] = null;
        continue;
      }

      // Normalize depth values to absolute (some GEF files use negative depths)
      if (col && depthColumnNumbers.has(col.colNum)) {
        row[colName] = Math.abs(result.data);
      } else {
        row[colName] = result.data;
      }
    }

    // Check for optional text field (spec: "extra text in the data block if #COLUMNTEXT is used")
    if (rawValues.length > columnInfo.length) {
      const textValue = rawValues[columnInfo.length]?.trim();
      if (textValue) {
        if (hasTextColumn) {
          row.comment = textValue;
        } else {
          warnings.push(
            `Line ${lineNumber}, record ${
              recordIndex + 1
            }: found text value "${textValue}" but #COLUMNTEXT header is missing. Text field ignored.`,
          );
        }
      }
    }

    // Warn if there are fewer columns than expected
    if (rawValues.length < columnInfo.length) {
      warnings.push(
        `Line ${lineNumber}, record ${recordIndex + 1}: found ${
          rawValues.length
        } columns but expected ${columnInfo.length}. Missing ${
          columnInfo.length - rawValues.length
        } column(s) - values set to null`,
      );
    }

    // Warn if there are more columns than expected (beyond the optional comment)
    if (rawValues.length > columnInfo.length + 1) {
      warnings.push(
        `Line ${lineNumber}, record ${recordIndex + 1}: found ${
          rawValues.length
        } columns but expected ${
          columnInfo.length
        } (+ optional comment). Extra columns: ${rawValues
          .slice(columnInfo.length + 1)
          .join(", ")}`,
      );
    }

    return row;
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
  data?: Array<Row>,
): Array<string> {
  const warnings: Array<string> = [];

  if (!headers.COLUMNINFO) {
    return warnings;
  }

  const columnInfo = headers.COLUMNINFO;

  // Check for duplicate quantity numbers
  const quantityMap = new Map<number, Array<number>>();
  for (const col of columnInfo) {
    if (col.quantityNumber > 0) {
      const existing = quantityMap.get(col.quantityNumber) ?? [];
      existing.push(col.colNum);
      quantityMap.set(col.quantityNumber, existing);
    }
  }

  for (const [quantityNum, colNums] of quantityMap) {
    if (colNums.length > 1) {
      const quantityInfo = cptColumnQuantities[quantityNum];
      const quantityName = quantityInfo?.name ?? `Quantity ${quantityNum}`;
      warnings.push(
        `File '${filename}' has duplicate quantity number ${quantityNum} (${quantityName}) assigned to columns ${colNums.join(
          ", ",
        )}. Per GEF-CPT specification, each quantity should appear only once. This may cause ambiguous data interpretation and incorrect chart rendering.`,
      );
    }
  }

  // Check for required parameters (per GEF-CPT spec)
  const hasLength = columnInfo.some(
    (col) => col.quantityNumber === CPT_QUANTITY.LENGTH,
  );
  const hasConeResistance = columnInfo.some(
    (col) => col.quantityNumber === CPT_QUANTITY.CONE_RESISTANCE,
  );

  if (!hasLength) {
    warnings.push(
      `File '${filename}' missing required COLUMNINFO for Penetration length (quantity 1). Per GEF-CPT specification, penetration length is mandatory. Charts and depth calculations may not display correctly without this data.`,
    );
  }
  if (!hasConeResistance) {
    warnings.push(
      `File '${filename}' missing required COLUMNINFO for Cone resistance (quantity 2). Per GEF-CPT specification, cone resistance (qc) is mandatory for CPT tests.`,
    );
  }

  warnings.concat(
    checkColumnMinMac(headers.COLUMNMINMAX, data, columnInfo, filename),
  );

  return warnings;
}

// Validate COLUMNMINMAX bounds if present
function checkColumnMinMac(
  columnMinMax: GefCptHeaders["COLUMNMINMAX"],
  data: Array<Row> | undefined,
  columnInfo: Array<ColumnInfo>,
  filename: string,
) {
  const warnings: Array<string> = [];
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
        warnings.push(
          `File '${filename}' column ${columnNumber} (${
            colInfo.name
          }): actual data range [${actualMin.toFixed(3)}, ${actualMax.toFixed(
            3,
          )}] exceeds declared COLUMNMINMAX range [${min}, ${max}]. This indicates the COLUMNMINMAX header does not match the actual data, which may suggest data quality issues or incorrect metadata.`,
        );
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

export const DEPTH_KEYWORDS = [
  "penetration",
  "sondeer",
  "length",
  "diepte",
  "lengte",
];
