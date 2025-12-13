import z from "zod";
import { convertToWGS84, WGS84Coords } from "./coordinates.js";
import {
  parseGefBoreData,
  parseGefBoreSpecimens,
  processBoreMetadata,
  type GefBoreData,
} from "./gef-bore.js";
import {
  generateCptWarnings,
  parseGefCptData,
  parsePreExcavationLayers,
  processCptMetadata,
  type GefCptData,
} from "./gef-cpt.js";
import { formatGefDate, formatGefTime } from "./gef-metadata-processed.js";
import {
  COORDINATE_SYSTEMS,
  HEIGHT_SYSTEMS,
  type GefBoreHeaders,
  type GefCptHeaders,
} from "./gef-schemas.js";
import initGefFileToMap, { parse_gef_wasm } from "./wasm/gef_file_to_map.js";

export type GEFHeadersMap = Map<string, Array<Array<string>>>;

export type GefFileType = "CPT" | "BORE";

export type GefData = GefCptData | GefBoreData;

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

export interface ProcessedMetadata {
  filename: string;
  fileType: GefFileType;
  wgs84: WGS84Coords | null;
  wgs84Error: string | null;
  projectId: string | undefined;
  testId: string | undefined;
  companyName: string | undefined;
  companyAddress: string | undefined;
  companyCountryCode: string | undefined;
  startDate: string | undefined;
  startTime: string | undefined;
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
  heightSystem: {
    code: string;
    name: string;
    nameEn: string;
    epsg: string | null;
  } | null;
  surfaceElevation: number | undefined;
  elevationUncertainty: number | undefined;
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

interface CommonProcessedFields {
  filename: string;
  fileType: GefFileType;
  wgs84: WGS84Coords | null;
  wgs84Error: string | null;
  projectId: string | undefined;
  testId: string | undefined;
  companyName: string | undefined;
  companyAddress: string | undefined;
  companyCountryCode: string | undefined;
  startDate: string | undefined;
  startTime: string | undefined;
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
  heightSystem: {
    code: string;
    name: string;
    nameEn: string;
    epsg: string | null;
  } | null;
  surfaceElevation: number | undefined;
  elevationUncertainty: number | undefined;
  // File metadata
  gefVersion: string | undefined;
  reportCode: string | undefined;
  measurementCode: string | undefined;
  fileDate: string | undefined;
  fileOwner: string | undefined;
  operatingSystem: string | undefined;
  comments: Array<string>;
}

export function processCommonFields(
  filename: string,
  fileType: GefFileType,
  headers: GefCptHeaders | GefBoreHeaders,
): CommonProcessedFields {
  let wgs84: WGS84Coords | null = null;
  let wgs84Error: string | null = null;

  if (headers.XYID) {
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
  }

  const coordinateSystem = headers.XYID
    ? {
        code: headers.XYID.coordinateSystem,
        name: COORDINATE_SYSTEMS[headers.XYID.coordinateSystem].name,
        nameEn: COORDINATE_SYSTEMS[headers.XYID.coordinateSystem].nameEn,
        epsg: COORDINATE_SYSTEMS[headers.XYID.coordinateSystem].epsg,
      }
    : null;

  const heightSystem = headers.ZID
    ? {
        code: headers.ZID.code,
        name: HEIGHT_SYSTEMS[headers.ZID.code].name,
        nameEn: HEIGHT_SYSTEMS[headers.ZID.code].nameEn,
        epsg: HEIGHT_SYSTEMS[headers.ZID.code].epsg,
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
    wgs84,
    wgs84Error,
    projectId: headers.PROJECTID,
    testId: headers.TESTID,
    companyName: headers.COMPANYID?.name,
    companyAddress: headers.COMPANYID?.address,
    companyCountryCode: headers.COMPANYID?.countryCode,
    startDate: headers.STARTDATE ? formatGefDate(headers.STARTDATE) : undefined,
    startTime: headers.STARTTIME ? formatGefTime(headers.STARTTIME) : undefined,
    coordinateSystem,
    originalX: headers.XYID?.x,
    originalY: headers.XYID?.y,
    xUncertainty: headers.XYID?.deltaX,
    yUncertainty: headers.XYID?.deltaY,
    heightSystem,
    surfaceElevation: headers.ZID?.height,
    elevationUncertainty: headers.ZID?.deltaZ,
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
 * Get a measurement variable object by ID from parsed headers
 */
function getMeasurementVar(
  measurementVars: Array<{ id: number; value: number; unit: string }>,
  id: number,
) {
  return measurementVars.find((v) => v.id === id);
}

/**
 * Get a measurement variable numeric value by ID from parsed headers
 */
export function getMeasurementVarValue(
  measurementVars: Array<{ id: number; value: number; unit: string }>,
  id: number,
): number | undefined {
  const mv = getMeasurementVar(measurementVars, id);
  return mv?.value;
}

function detectFileType(reportCode: string): GefFileType {
  const lowercaseReportCode = reportCode.toLowerCase();

  // Check for unsupported file types
  if (lowercaseReportCode.includes("diss")) {
    throw new Error("dissipationTestNotSupported");
  }
  if (lowercaseReportCode.includes("siev")) {
    throw new Error("sieveTestNotSupported");
  }

  if (lowercaseReportCode.includes("bore")) {
    return "BORE";
  }
  return "CPT";
}

// Generate warnings common to both CPT and BORE files
function generateCommonWarnings(
  filename: string,
  headers: GefCptHeaders | GefBoreHeaders,
  headersMap: GEFHeadersMap,
): Array<string> {
  const warnings: Array<string> = [];

  // Check for missing or invalid ZID
  const rawZid = headersMap.get("ZID")?.[0];

  if (!rawZid || rawZid.length === 0) {
    warnings.push(`missingZidHeader:${filename}`);
  } else {
    const heightCode = rawZid[0]?.trim();
    if (heightCode && !(heightCode in HEIGHT_SYSTEMS)) {
      warnings.push(`unknownHeightSystem:${filename}:${heightCode}`);
    }
    if (rawZid.length < 2) {
      warnings.push(`zidWithoutHeight:${filename}`);
    }
  }

  // Check for missing XYID (location)
  if (!headers.XYID) {
    warnings.push(`missingXyidHeader:${filename}`);
  }

  // Check for COLUMNINFO missing quantityNumber (4th element per spec)
  const rawColumnInfo = headersMap.get("COLUMNINFO");
  if (rawColumnInfo) {
    const missingQuantityNumbers = rawColumnInfo.filter(
      (col) => col.length < 4,
    );
    if (missingQuantityNumbers.length > 0) {
      const count = missingQuantityNumbers.length;
      warnings.push(`missingColumnInfoQuantity:${filename}:${count}`);
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

export async function parseGefFile(file: File): Promise<GefData> {
  await ensureWasmInitialized();

  const gefContent = await file.text();

  const gefToMapSchema = z.object({
    data: z.string(),
    headers: z.object({
      headers: z.map(z.string(), z.array(z.array(z.string()))),
    }),
  });
  const gefMap = gefToMapSchema.parse(parse_gef_wasm(gefContent));

  const reportCode =
    gefMap.headers.headers.get("REPORTCODE")?.[0]?.[0] ?? "cpt";

  const fileType = detectFileType(reportCode);

  if (fileType === "BORE") {
    const {
      layers,
      headers,
      warnings: parseWarnings,
    } = parseGefBoreData(gefMap.data, gefMap.headers.headers);
    const specimens = parseGefBoreSpecimens(headers);
    const warnings = [
      ...parseWarnings,
      ...generateCommonWarnings(file.name, headers, gefMap.headers.headers),
    ];
    const processed = processBoreMetadata(file.name, headers);

    return {
      fileType,
      layers,
      specimens,
      headers,
      warnings,
      processed,
    };
  }

  const {
    data,
    columnInfo,
    headers,
    warnings: parseWarnings,
  } = parseGefCptData(gefMap.data, gefMap.headers.headers);

  const preExcavationLayers = parsePreExcavationLayers(headers);

  const warnings = [
    ...parseWarnings,
    ...generateCommonWarnings(file.name, headers, gefMap.headers.headers),
    ...generateCptWarnings(file.name, headers, data),
  ];
  const processed = processCptMetadata(file.name, headers);

  return {
    fileType,
    data,
    headers,
    columnInfo,
    preExcavationLayers,
    warnings,
    processed,
  };
}
