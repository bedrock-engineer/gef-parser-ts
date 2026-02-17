import z from "zod";
import { convertToWGS84, WGS84Coords } from "./coordinates.js";
import {
  parseGefBoreData,
  processBoreMetadata,
  type GefBoreData,
} from "./gef-bore.js";
import {
  generateCptWarnings,
  parseGefCptData,
  processCptMetadata,
  type GefCptData,
} from "./gef-cpt.js";
import {
  generateDissWarnings,
  parseGefDissData,
  processDissMetadata,
  type GefDissData,
} from "./gef-diss.js";
import { formatGefDate, formatGefTime } from "./gef-metadata-processed.js";
import { descriptionToKey } from "./gef-measurement-mappings.js";
import {
  COORDINATE_SYSTEMS,
  HEIGHT_SYSTEMS,
  type ColumnInfo,
  type GefBoreHeaders,
  type GefCptHeaders,
  type GefDissHeaders,
} from "./gef-schemas.js";
import type { PreExcavationLayer, GefExtension } from "./gef-cpt.js";
import type { Child } from "./gef-schemas.js";
import type { BoreSpecimen } from "./gef-bore.js";
import type { Parent } from "./gef-schemas.js";
import type { GefWarning } from "./gef-warnings.js";
import initGefFileToMap, { parse_gef_wasm } from "./wasm/gef_file_to_map.js";

export type GEFHeadersMap = Map<string, Array<Array<string>>>;

export type GefFileType = "CPT" | "BORE" | "DISS";

export type GefData = GefCptData | GefBoreData | GefDissData;

export interface ProcessedItemMetadata {
  id: number;
  category: string;
  description: string;
  descriptionNl?: string;
  required?: boolean;
}

export interface ProcessedMeasurement {
  value: number;
  unit: string;
  metadata: ProcessedItemMetadata;
}

export interface ProcessedText {
  value: string;
  decoded?: string; // Decoded/formatted version (e.g., "Pulsboring (PUL)")
  metadata: ProcessedItemMetadata;
}

export interface ProcessedLocation {
  wgs84: WGS84Coords | null;
  wgs84Error: string | null;
  coordinateSystem: {
    code: string;
    name: string;
    nameEn: string;
    epsg: string | null;
  } | null;
  originalX: number | undefined;
  originalY: number | undefined;
  xUncertainty: number | undefined;
  yUncertainty: number | undefined;
}

export interface ProcessedElevation {
  heightSystem: {
    code: string;
    name: string;
    nameEn: string;
    epsg: string | null;
  } | null;
  surfaceElevation: number | undefined;
  uncertainty: number | undefined;
}

export interface ProcessedCompany {
  name: string;
  address: string | undefined;
  countryCode: string | undefined;
}

export interface ProcessedMetadataBase {
  filename: string;
  fileType: GefFileType;
  projectId: string | undefined;
  testId: string | undefined;
  company: ProcessedCompany | null;
  startDate: string | undefined;
  startTime: string | undefined;
  location: ProcessedLocation | null;
  elevation: ProcessedElevation | null;
  // File metadata
  gefVersion: string | undefined;
  reportCode: string | undefined;
  measurementCode: string | undefined;
  fileDate: string | undefined;
  fileOwner: string | undefined;
  operatingSystem: string | undefined;
  comments: Array<string>;
  measurements: Record<string, ProcessedMeasurement>;
  texts: Record<string, ProcessedText>;
}

export interface ProcessedColumn {
  columnName: string;
  unit: string;
  quantityNumber: number;
  description: string;
  descriptionNl: string;
}

export interface ProcessedCptMetadata extends ProcessedMetadataBase {
  fileType: "CPT";
  extension: GefExtension;
  columns: Record<string, ProcessedColumn>;
  preExcavationLayers: Array<PreExcavationLayer>;
  children: Array<Child>;
}

export interface ProcessedBoreMetadata extends ProcessedMetadataBase {
  fileType: "BORE";
  specimens: Array<BoreSpecimen>;
}

export interface ProcessedDissMetadata extends ProcessedMetadataBase {
  fileType: "DISS";
  columns: Record<string, ProcessedColumn>;
  parent: Parent | undefined;
}

export type ProcessedMetadata =
  | ProcessedCptMetadata
  | ProcessedBoreMetadata
  | ProcessedDissMetadata;

// -- Shared data-parsing helpers --

export interface ParseRecordsConfig {
  columnSeparator: string | RegExp;
  recordSeparator: string | RegExp;
  columnInfo: Array<ColumnInfo>;
  voidValues: Map<number, number>;
  hasTextColumn: boolean;
  /** Column numbers where values should be Math.abs()'d (CPT depth normalization) */
  absoluteValueColumns?: Set<number>;
}

export interface ParseRecordsResult {
  rows: Array<Record<string, number | string | null | undefined>>;
  warnings: Array<GefWarning>;
}

/**
 * Shared record-parsing loop for CPT and DISS data blocks.
 * Splits records, coerces numbers with zod, checks voids, tracks line numbers,
 * handles text columns, and accumulates warnings.
 */
export function parseGefRecords(
  dataString: string,
  config: ParseRecordsConfig,
): ParseRecordsResult {
  const {
    columnSeparator,
    recordSeparator,
    columnInfo,
    voidValues,
    hasTextColumn,
    absoluteValueColumns,
  } = config;
  const warnings: Array<GefWarning> = [];

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

  const rows = records.map((record, recordIndex) => {
    const lineNumber = recordLineNumbers[recordIndex] ?? 0;
    const rawValues = record
      .trim()
      .split(columnSeparator)
      .filter((val) => val.trim() !== "");

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
        warnings.push({
          type: "invalidNumber",
          line: lineNumber,
          record: recordIndex + 1,
          column: colName,
          rawValue: trimmed,
        });
        row[colName] = null;
        continue;
      }

      // Check if this is a void value
      const voidValue = voidValues.get(colIndex + 1);
      if (result.data === voidValue) {
        row[colName] = null;
        continue;
      }

      // Normalize values to absolute if configured (e.g. CPT depth columns)
      if (col && absoluteValueColumns?.has(col.colNum)) {
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
          warnings.push({
            type: "missingColumnTextHeader",
            line: lineNumber,
            record: recordIndex + 1,
            textValue,
          });
        }
      }
    }

    // Warn if there are fewer columns than expected
    if (rawValues.length < columnInfo.length) {
      warnings.push({
        type: "missingColumns",
        line: lineNumber,
        record: recordIndex + 1,
        found: rawValues.length,
        expected: columnInfo.length,
      });
    }

    // Warn if there are more columns than expected (beyond the optional comment)
    if (rawValues.length > columnInfo.length + 1) {
      warnings.push({
        type: "extraColumns",
        line: lineNumber,
        record: recordIndex + 1,
        found: rawValues.length,
        expected: columnInfo.length,
        extraValues: rawValues.slice(columnInfo.length + 1),
      });
    }

    return row;
  });

  return { rows, warnings };
}

/**
 * Check for duplicate quantity numbers in column info.
 * Shared between CPT and DISS warning generators.
 */
export function checkDuplicateQuantities(
  filename: string,
  columnInfo: Array<ColumnInfo>,
  quantitySpec: Record<number, { name: string }>,
): Array<GefWarning> {
  const warnings: Array<GefWarning> = [];

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
      const quantityInfo = quantitySpec[quantityNum];
      const quantityName = quantityInfo?.name ?? `Quantity ${quantityNum}`;
      warnings.push({
        type: "duplicateQuantity",
        filename,
        quantityNumber: quantityNum,
        quantityName,
        columns: colNums,
      });
    }
  }

  return warnings;
}

export function processCommonFields(
  filename: string,
  fileType: GefFileType,
  headers: GefCptHeaders | GefBoreHeaders | GefDissHeaders,
): Omit<ProcessedMetadataBase, "measurements" | "texts"> {
  // Build location sub-object
  let location: ProcessedLocation | null = null;
  if (headers.XYID) {
    let wgs84: WGS84Coords | null = null;
    let wgs84Error: string | null = null;

    const result = convertToWGS84({
      coordinateSystem: headers.XYID.coordinateSystem,
      x: headers.XYID.x,
      y: headers.XYID.y,
    });

    if (result.success) {
      wgs84 = result.coords;
    } else {
      wgs84Error = result.error;
    }

    location = {
      wgs84,
      wgs84Error,
      coordinateSystem: {
        code: headers.XYID.coordinateSystem,
        name: COORDINATE_SYSTEMS[headers.XYID.coordinateSystem].name,
        nameEn: COORDINATE_SYSTEMS[headers.XYID.coordinateSystem].nameEn,
        epsg: COORDINATE_SYSTEMS[headers.XYID.coordinateSystem].epsg,
      },
      originalX: headers.XYID.x,
      originalY: headers.XYID.y,
      xUncertainty: headers.XYID.deltaX,
      yUncertainty: headers.XYID.deltaY,
    };
  }

  // Build elevation sub-object
  let elevation: ProcessedElevation | null = null;
  if (headers.ZID) {
    elevation = {
      heightSystem: {
        code: headers.ZID.code,
        name: HEIGHT_SYSTEMS[headers.ZID.code].name,
        nameEn: HEIGHT_SYSTEMS[headers.ZID.code].nameEn,
        epsg: HEIGHT_SYSTEMS[headers.ZID.code].epsg,
      },
      surfaceElevation: headers.ZID.height,
      uncertainty: headers.ZID.deltaZ,
    };
  }

  // Build company sub-object
  const company: ProcessedCompany | null = headers.COMPANYID
    ? {
        name: headers.COMPANYID.name,
        address: headers.COMPANYID.address,
        countryCode: headers.COMPANYID.countryCode,
      }
    : null;

  // Format file metadata
  const gefVersion = headers.GEFID
    ? `${headers.GEFID.major}.${headers.GEFID.minor}.${headers.GEFID.patch}`
    : undefined;

  const reportCode = headers.REPORTCODE
    ? `${headers.REPORTCODE.code} v${headers.REPORTCODE.major}.${headers.REPORTCODE.minor}.${headers.REPORTCODE.patch}`
    : undefined;

  const measurementCode = headers.MEASUREMENTCODE
    ? (() => {
        const hasVersion =
          headers.MEASUREMENTCODE.major > 0 ||
          headers.MEASUREMENTCODE.minor > 0 ||
          headers.MEASUREMENTCODE.patch > 0;
        return hasVersion
          ? `${headers.MEASUREMENTCODE.code} v${headers.MEASUREMENTCODE.major}.${headers.MEASUREMENTCODE.minor}.${headers.MEASUREMENTCODE.patch}`
          : headers.MEASUREMENTCODE.code;
      })()
    : undefined;

  return {
    filename,
    fileType,
    projectId: headers.PROJECTID,
    testId: headers.TESTID,
    company,
    startDate: headers.STARTDATE ? formatGefDate(headers.STARTDATE) : undefined,
    startTime: headers.STARTTIME ? formatGefTime(headers.STARTTIME) : undefined,
    location,
    elevation,
    // File metadata
    gefVersion,
    reportCode,
    measurementCode,
    fileDate: headers.FILEDATE ? formatGefDate(headers.FILEDATE) : undefined,
    fileOwner: headers.FILEOWNER,
    operatingSystem: headers.OS,
    comments: headers.COMMENT ?? [],
  };
}

/**
 * Build a map of semantic column keys from columnInfo and quantity spec.
 * Keys are camelCase derived from the quantity name (e.g. "penetrationLength").
 * Skips columns with quantityNumber 0 (unknown) and category "reserved".
 */
export function buildColumnMap(
  columnInfo: Array<ColumnInfo>,
  quantitySpec: Record<
    number,
    {
      name: string;
      nameNl: string;
      unit: string | null;
      description: string;
      descriptionNl: string;
      category: string;
    }
  >,
): Record<string, ProcessedColumn> {
  const columns: Record<string, ProcessedColumn> = {};

  for (const col of columnInfo) {
    if (col.quantityNumber === 0) {
      continue;
    }

    const spec = quantitySpec[col.quantityNumber];
    if (!spec || spec.category === "reserved") {
      continue;
    }

    const key = descriptionToKey(spec.name);

    columns[key] = {
      columnName: col.name,
      unit: col.unit,
      quantityNumber: col.quantityNumber,
      description: spec.description,
      descriptionNl: spec.descriptionNl,
    };
  }

  return columns;
}

interface MeasurementVar {
  id: number;
  value: number | undefined;
  unit: string;
}

/**
 * Get a measurement variable object by ID from parsed headers
 */
function getMeasurementVar(measurementVars: Array<MeasurementVar>, id: number) {
  return measurementVars.find((v) => v.id === id);
}

/**
 * Get a measurement variable numeric value by ID from parsed headers
 */
export function getMeasurementVarValue(
  measurementVars: Array<MeasurementVar>,
  id: number,
): number | undefined {
  const mv = getMeasurementVar(measurementVars, id);
  return mv?.value;
}

function detectFileType(reportCode: string): GefFileType {
  const lowercaseReportCode = reportCode.toLowerCase();

  // Check for unsupported file types
  if (lowercaseReportCode.includes("siev")) {
    throw new Error("sieveTestNotSupported");
  }

  if (lowercaseReportCode.includes("diss")) {
    return "DISS";
  }
  if (lowercaseReportCode.includes("bore")) {
    return "BORE";
  }
  return "CPT";
}

// Generate warnings common to both CPT and BORE files
function generateCommonWarnings(
  filename: string,
  headers: GefCptHeaders | GefBoreHeaders | GefDissHeaders,
  headersMap: GEFHeadersMap,
): Array<GefWarning> {
  const warnings: Array<GefWarning> = [];

  // Check for missing or invalid ZID
  const rawZid = headersMap.get("ZID")?.[0];

  if (!rawZid || rawZid.length === 0) {
    warnings.push({ type: "missingHeader", header: "ZID", filename });
  } else {
    const heightCode = rawZid[0]?.trim();
    if (heightCode && !(heightCode in HEIGHT_SYSTEMS)) {
      warnings.push({ type: "unknownHeightSystem", filename, heightCode });
    }
    if (rawZid.length < 2) {
      warnings.push({ type: "zidWithoutHeight", filename });
    }
  }

  // Check for missing XYID (location)
  if (!headers.XYID) {
    warnings.push({ type: "missingHeader", header: "XYID", filename });
  }

  // Check for COLUMNINFO missing quantityNumber (4th element per spec)
  const rawColumnInfo = headersMap.get("COLUMNINFO");
  if (rawColumnInfo) {
    const missingQuantityNumbers = rawColumnInfo.filter(
      (col) => col.length < 4,
    );
    if (missingQuantityNumbers.length > 0) {
      const count = missingQuantityNumbers.length;
      warnings.push({ type: "missingColumnInfoQuantity", filename, count });
    }
  }

  return warnings;
}

// Cache WASM initialization to prevent memory leaks
let wasmInitialized = false;
async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    await initGefFileToMap();
    wasmInitialized = true;
  }
}

export async function parseGefFile(
  gefContent: string,
  filename: string,
): Promise<GefData> {
  await ensureWasmInitialized();

  // Strip BOM (byte order mark) — the WASM parser cannot handle it
  const content = gefContent.replace(/^\uFEFF/, "");

  const gefToMapSchema = z.object({
    data: z.string(),
    headers: z.object({
      headers: z.map(z.string(), z.array(z.array(z.string()))),
    }),
  });
  const gefMap = gefToMapSchema.parse(parse_gef_wasm(content));

  const reportCode =
    gefMap.headers.headers.get("REPORTCODE")?.[0]?.[0] ?? "cpt";

  const fileType = detectFileType(reportCode);

  switch (fileType) {
    case "CPT": {
      const {
        data,
        columnInfo,
        headers,
        warnings: parseWarnings,
      } = parseGefCptData(gefMap.data, gefMap.headers.headers);

      const warnings = [
        ...parseWarnings,
        ...generateCommonWarnings(filename, headers, gefMap.headers.headers),
        ...generateCptWarnings(filename, headers, data),
      ];
      const processed = processCptMetadata(filename, headers, columnInfo);

      return {
        fileType,
        data,
        headers,
        columnInfo,
        warnings,
        processed,
      };
    }
    case "BORE": {
      const {
        layers,
        headers,
        warnings: parseWarnings,
      } = parseGefBoreData(gefMap.data, gefMap.headers.headers);
      const warnings = [
        ...parseWarnings,
        ...generateCommonWarnings(filename, headers, gefMap.headers.headers),
      ];
      const processed = processBoreMetadata(filename, headers);

      return {
        fileType,
        layers,
        headers,
        warnings,
        processed,
      };
    }
    case "DISS": {
      const {
        data,
        columnInfo,
        headers,
        warnings: parseWarnings,
      } = parseGefDissData(gefMap.data, gefMap.headers.headers);
      const warnings = [
        ...parseWarnings,
        ...generateCommonWarnings(filename, headers, gefMap.headers.headers),
        ...generateDissWarnings(filename, headers),
      ];
      const processed = processDissMetadata(filename, headers, columnInfo);

      return {
        fileType,
        data,
        headers,
        columnInfo,
        warnings,
        processed,
      };
    }
    default: {
      throw new Error("unsupportedGefFileType");
    }
  }
}
