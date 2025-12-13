import { z } from "zod";
import type { $ZodIssue } from "zod/v4/core";
import type { GEFHeadersMap } from "./gef-common.js";

const stringArray = z.array(z.string().trim());

const coordinateSystemCodes = [
  "00000",
  "00001",
  "01000",
  "31000",
  "31001",
  "31002",
  "32000",
  "49000",
] as const;

export const COORDINATE_SYSTEMS = {
  "00000": {
    epsg: null,
    name: "Lokaal coördinatensysteem",
    nameEn: "Local coordinate system (self-defined)",
    country: "N/A",
  },
  "00001": {
    epsg: "EPSG:4326",
    name: "Geografisch coördinatensysteem",
    nameEn: "Geographic coordinate system (WGS 84)",
    country: "International",
  },
  "01000": {
    epsg: null, // SPCS has many zones, would need specific zone
    name: "State Plane Coordinate System",
    nameEn: "State Plane Coordinate System",
    country: "USA",
  },
  "31000": {
    epsg: "EPSG:28992",
    proj4def:
      "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs",
    name: "Rijksdriehoekscoördinaten",
    nameEn: "Dutch National Grid",
    country: "Netherlands",
  },
  "31001": {
    epsg: "EPSG:32631",
    name: "UTM zone 31N",
    nameEn: "WGS 84 / UTM zone 31N",
    country: "International",
  },
  "31002": {
    epsg: "EPSG:32609",
    name: "UTM zone 9N",
    nameEn: "WGS 84 / UTM zone 9N",
    country: "International",
  },
  "32000": {
    epsg: "EPSG:31370",
    proj4def:
      "+proj=lcc +lat_0=90 +lon_0=4.36748666666667 +lat_1=51.1666672333333 +lat_2=49.8333339 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs",
    name: "Belge 1972 / Belgian Lambert 72",
    nameEn: "Belgian Lambert 72",
    country: "Belgium",
  },
  "49000": {
    epsg: "EPSG:31467",
    name: "DHDN / Gauss-Krüger zone 3",
    nameEn: "German Gauss-Krüger zone 3",
    country: "Germany",
  },
} as const;

const coordinateSystemCodeSchema = z.enum(coordinateSystemCodes);

export type CoordinateSystemCode = z.infer<typeof coordinateSystemCodeSchema>;

const heightSystemCodes = [
  "00000",
  "00001",
  "31000",
  "32000",
  "32001",
  "49000",
] as const;

export const HEIGHT_SYSTEMS = {
  "00000": {
    name: "Lokaal referentiesysteem",
    nameEn: "Local reference system (self-defined)",
    epsg: null,
    country: "N/A",
  },
  "00001": {
    name: "Low Low Water Spring",
    nameEn: "Low Low Water Spring",
    epsg: null,
    country: "International",
  },
  "31000": {
    name: "Normaal Amsterdams Peil",
    nameEn: "Amsterdam Ordnance Datum",
    epsg: "EPSG:7415", // ETRS89 + NAP height
    country: "Netherlands",
  },
  "32000": {
    name: "Ostend Level",
    nameEn: "Ostend Height",
    epsg: "EPSG:5710",
    country: "Belgium",
  },
  "32001": {
    name: "Tweede Algemene Waterpassing",
    nameEn: "Second General Levelling",
    epsg: "EPSG:5710", // TAW
    country: "Belgium",
  },
  "49000": {
    name: "Normalnull",
    nameEn: "Normal Null (German standard height)",
    epsg: "EPSG:5783", // DHHN92 height
    country: "Germany",
  },
} as const;

const heightSystemCodeSchema = z.enum(heightSystemCodes);

export type HeightSystemCode = z.infer<typeof heightSystemCodeSchema>;

// Coordinate System (parses from string tuple, validates as numbers)
// Default to RD (31000) if coordinate system is invalid or unrecognized
// Handle empty arrays or missing values gracefully some GEF files have empty XYID
const xyidSchema = z
  .tuple([
    z.string().trim(),
    z.coerce.number(),
    z.coerce.number(),
    z.coerce.number().nonnegative().optional(),
    z.coerce.number().nonnegative().optional(),
  ])
  .transform(([coordinateSystem, x, y, deltaX, deltaY]) => {
    // Validate coordinate system, default to RD if invalid
    const validatedCoordinateSystem = coordinateSystemCodeSchema
      .catch("31000")
      .parse(coordinateSystem);

    return {
      coordinateSystem: validatedCoordinateSystem,
      x,
      y,
      deltaX,
      deltaY,
    };
  });

export type XYID = z.infer<typeof xyidSchema>;

// Height Reference System
// Default to NAP (31000) if coordinate system is invalid or unrecognized
const zidSchema = z
  .array(z.string().trim())
  .min(2, { message: "#ZID must have at least 2 values: code and height" })
  .max(3, { message: "#ZID must have at most 3 values: code, height, deltaZ" })
  .transform((arr) => {
    const code = heightSystemCodeSchema.catch("31000").parse(arr[0]);
    const height = arr[1] ? z.coerce.number().parse(arr[1]) : 0;
    const deltaZ =
      arr[2] !== undefined && arr[2] !== ""
        ? z.coerce.number().nonnegative().parse(arr[2])
        : undefined;
    return { code, height, deltaZ };
  });

export type ZID = z.infer<typeof zidSchema>;

// ============================================================================
// VERSIONING
// ============================================================================

const gefIdSchema = z
  .tuple(
    [
      z.coerce.number().int().min(0),
      z.coerce.number().int().min(0),
      z.coerce.number().int().min(0),
    ],
    {
      message: "#GEFID must have 3 values: major, minor, patch (e.g., 1, 1, 0)",
    },
  )
  .transform(([major, minor, patch]) => ({
    major,
    minor,
    patch,
  }))
  .pipe(
    z.object({
      major: z.number().int().min(0),
      minor: z.number().int().min(0),
      patch: z.number().int().min(0),
    }),
  );

export type GefId = z.infer<typeof gefIdSchema>;

const reportCodeSchema = z
  .tuple([
    z.string(),
    z.coerce.number().int().min(0),
    z.coerce.number().int().min(0),
    z.coerce.number().int().min(0),
  ])
  .rest(z.string())
  .transform(([code, major, minor, patch, ...extra]) => ({
    code,
    major,
    minor,
    patch,
    extra,
  }))
  .pipe(
    z.object({
      code: z.string(),
      major: z.number().int().min(0),
      minor: z.number().int().min(0),
      patch: z.number().int().min(0),
      extra: z.array(z.string()),
    }),
  );

export type ReportCode = z.infer<typeof reportCodeSchema>;

// ============================================================================
// DATE & TIME
// ============================================================================

const dateSchema = z
  .tuple(
    [z.coerce.number().int(), z.coerce.number().int(), z.coerce.number().int()],
    {
      message: "Date must have 3 values: year, month, day (e.g., 2024, 1, 15)",
    },
  )
  .transform(([year, month, day]) => ({
    year,
    month,
    day,
  }))
  .pipe(
    z.object({
      year: z.number().int({ message: "Year must be a whole number" }),
      month: z
        .number()
        .int()
        .min(1, { message: "Month must be between 1 and 12" })
        .max(12, { message: "Month must be between 1 and 12" }),
      day: z
        .number()
        .int()
        .min(1, { message: "Day must be between 1 and 31" })
        .max(31, { message: "Day must be between 1 and 31" }),
    }),
  );

export type GefDate = z.infer<typeof dateSchema>;

const timeSchema = z
  .tuple([z.string(), z.string(), z.string()], {
    message: "Time must have 3 values: hour, minute, second (e.g., 14, 30, 0)",
  })
  .transform(([hour, minute, second]) => {
    // Handle placeholder values like "-" which are used when time is unknown
    if (hour === "-" || minute === "-" || second === "-") {
      return null;
    }
    return {
      hour: parseInt(hour),
      minute: parseInt(minute),
      second: parseInt(second),
    };
  })
  .pipe(
    z
      .object({
        hour: z
          .number()
          .int()
          .min(0, { message: "Hour must be between 0 and 23" })
          .max(23, { message: "Hour must be between 0 and 23" }),
        minute: z
          .number()
          .int()
          .min(0, { message: "Minute must be between 0 and 59" })
          .max(59, { message: "Minute must be between 0 and 59" }),
        second: z
          .number()
          .int()
          .min(0, { message: "Second must be between 0 and 59" })
          .max(59, { message: "Second must be between 0 and 59" }),
      })
      .nullable(),
  );

export type GefTime = z.infer<typeof timeSchema>;

const companyIdSchema = z
  .tuple([
    z.string().trim(),
    z.string().trim().optional(),
    z.string().trim().optional(),
  ])
  .transform(([name, address, countryCode]) => ({
    name,
    address,
    countryCode,
  }));

export type CompanyId = z.infer<typeof companyIdSchema>;

const columnInfoSchema = z
  .tuple([
    z.coerce.number().int().positive(),
    z.string().trim(),
    z.string().trim(),
    z.coerce.number().int().optional().default(0),
  ])
  .transform(([colNum, unit, name, quantityNumber]) => ({
    colNum,
    unit,
    name,
    quantityNumber,
  }))
  .pipe(
    z.object({
      colNum: z
        .number()
        .int()
        .positive({ message: "Column number must be a positive integer" }),
      unit: z.string(),
      name: z.string(),
      quantityNumber: z.number().int().min(0),
    }),
  );

export type ColumnInfo = z.infer<typeof columnInfoSchema>;

const measurementVarSchema = z
  .array(z.string().trim())
  .min(2)
  .transform((arr) => {
    const idStr = arr[0];
    const valueStr = arr[1];
    const unit = arr[2];
    // Join all remaining elements as description (handles commas in descriptions)
    const description = arr.slice(3).join(", ");

    const id = z.coerce.number().int().min(1).max(1500).parse(idStr);

    // Handle missing values
    // "-" is the standard way to indicate missing/unavailable data in GEF files
    // Empty strings should also be treated as missing (not converted to 0)
    let value: number | undefined;
    if (valueStr === "-" || valueStr === "") {
      value = undefined;
    } else {
      value = z.coerce.number().parse(valueStr);
    }

    return {
      id,
      value,
      unit: unit ?? "-",
      description: description,
    };
  });

export type MeasurementVar = z.infer<typeof measurementVarSchema>;

const measurementTextSchema = z
  .tuple([z.coerce.number().int(), z.string().trim()])
  .rest(z.string().trim())
  .transform(([id, text, ...extra]) => ({
    id,
    text,
    extra,
  }))
  .pipe(
    z.object({
      id: z.number().int().min(1),
      text: z.string(),
      extra: z.array(z.string()),
    }),
  );

export type MeasurementText = z.infer<typeof measurementTextSchema>;

// SPECIMENVAR schema - same structure as MEASUREMENTVAR
const specimenVarSchema = z
  .array(z.string().trim())
  .min(2)
  .transform((arr) => {
    const idStr = arr[0];
    const valueStr = arr[1];
    const unit = arr[2];
    // Join all remaining elements as description (handles commas in descriptions)
    const description = arr.slice(3).join(", ");

    const id = z.coerce.number().int().min(1).max(1410).parse(idStr);

    // Handle missing values
    // "-" is the standard way to indicate missing/unavailable data in GEF files
    // Empty strings should also be treated as missing (not converted to 0)
    let value: number | undefined;
    if (valueStr === "-" || valueStr === "") {
      value = undefined;
    } else {
      value = z.coerce.number().parse(valueStr);
    }

    return {
      id,
      value,
      unit: unit ?? "-",
      description: description,
    };
  });

export type SpecimenVar = z.infer<typeof specimenVarSchema>;

// SPECIMENTEXT schema - same structure as MEASUREMENTTEXT
const specimenTextSchema = z
  .tuple([z.coerce.number().int(), z.string().trim()])
  .rest(z.string().trim())
  .transform(([id, text, ...extra]) => ({
    id,
    text,
    extra,
  }))
  .pipe(
    z.object({
      id: z.number().int().min(1).max(1410),
      text: z.string(),
      extra: z.array(z.string()),
    }),
  );

export type SpecimenText = z.infer<typeof specimenTextSchema>;

// =============================================================================
// BASE SCHEMA - Shared fields between CPT and BORE
// =============================================================================

const gefBaseHeadersSchema = z.object({
  // Project Information
  PROJECTID: z
    .array(stringArray)
    .optional()
    .transform((arr) => arr?.[0]?.[0]),

  TESTID: z
    .array(stringArray)
    .optional()
    .transform((arr) => arr?.[0]?.[0]),

  COMPANYID: z
    .array(z.tuple([z.string(), z.string().optional(), z.string().optional()]))
    .optional()
    .transform((arr) => (arr?.[0] ? companyIdSchema.parse(arr[0]) : undefined)),

  // Dates and Times
  STARTDATE: z
    .array(z.tuple([z.string(), z.string(), z.string()]))
    .optional()
    .transform((arr) => (arr?.[0] ? dateSchema.parse(arr[0]) : undefined)),

  STARTTIME: z
    .array(z.tuple([z.string(), z.string(), z.string()]))
    .optional()
    .transform((arr) => {
      if (!arr?.[0]) {
        return undefined;
      }
      const parsed = timeSchema.parse(arr[0]);
      return parsed ?? undefined;
    }),

  FILEDATE: z
    .array(z.tuple([z.string(), z.string(), z.string()]))
    .optional()
    .transform((arr) => (arr?.[0] ? dateSchema.parse(arr[0]) : undefined)),

  // Coordinates
  XYID: z
    .array(z.array(z.string()))
    .optional()
    .transform((arr) => {
      const coords = arr?.[0];
      // If array is empty or has less than 3 elements (missing coords), return undefined
      if (
        !coords ||
        coords.length < 3 ||
        coords.every((s) => s.trim() === "")
      ) {
        return undefined;
      }
      return xyidSchema.parse(coords);
    }),

  ZID: z
    .array(z.array(z.string()).min(1))
    .optional()
    .transform((arr) => (arr?.[0] ? zidSchema.parse(arr[0]) : undefined)),

  // Data Structure
  COLUMN: z
    .array(stringArray)
    .optional()
    .transform((arr) =>
      arr?.[0]?.[0] ? z.coerce.number().int().parse(arr[0][0]) : undefined,
    ),

  LASTSCAN: z
    .array(stringArray)
    .optional()
    .transform((arr) =>
      arr?.[0]?.[0] ? z.coerce.number().int().parse(arr[0][0]) : undefined,
    ),

  DATAFORMAT: z
    .array(stringArray)
    .optional()
    .transform((arr) => arr?.[0]?.[0]),

  COLUMNSEPARATOR: z
    .array(stringArray)
    .optional()
    .transform((arr) => arr?.[0]?.[0]?.trim()),

  RECORDSEPARATOR: z
    .array(stringArray)
    .optional()
    .transform((arr) => arr?.[0]?.[0]?.trim()),

  COLUMNINFO: z
    .array(z.array(z.string()).min(3))
    .optional()
    .transform((arr) => arr?.map((col) => columnInfoSchema.parse(col))),

  COLUMNVOID: z
    .array(z.tuple([z.coerce.number(), z.coerce.number()]))
    .optional()
    .transform((arr) =>
      arr?.map(([columnNumber, voidValue]) => ({ columnNumber, voidValue })),
    ),

  COLUMNTEXT: z
    .array(z.array(z.string()).min(1))
    .optional()
    .transform((arr) =>
      arr?.map((entry) => ({
        columnNumber: z.coerce.number().int().parse(entry[0]),
      })),
    ),

  // Measurement Data
  MEASUREMENTVAR: z
    .array(
      z.tuple([
        z.string(),
        z.string(),
        z.string().optional(),
        z.string().optional(),
      ]),
    )
    .optional()
    .transform((arr) => arr?.map((mv) => measurementVarSchema.parse(mv))),

  MEASUREMENTTEXT: z
    .array(z.array(z.string()).min(2))
    .optional()
    .transform((arr) => arr?.map((mt) => measurementTextSchema.parse(mt))),

  // File Metadata
  GEFID: z
    .array(z.tuple([z.string(), z.string(), z.string()]))
    .optional()
    .transform((arr) => (arr?.[0] ? gefIdSchema.parse(arr[0]) : undefined)),

  REPORTCODE: z
    .array(z.array(z.string()).min(4))
    .optional()
    .transform((arr) =>
      arr?.[0] ? reportCodeSchema.parse(arr[0]) : undefined,
    ),

  MEASUREMENTCODE: z
    .array(z.array(z.string()).min(1))
    .optional()
    .transform((arr) => {
      if (!arr?.[0]) {
        return undefined;
      }
      // If it has 4+ elements, parse as structured code (like REPORTCODE)
      if (arr[0].length >= 4) {
        try {
          return reportCodeSchema.parse(arr[0]);
        } catch {
          // If parsing fails, fall through to simple string
        }
      }
      // Otherwise treat as simple string (e.g., "Onbekend", "Unknown")
      return {
        code: arr[0][0] ?? "",
        major: 0,
        minor: 0,
        patch: 0,
        extra: arr[0].slice(1),
      };
    }),

  FILEOWNER: z
    .array(stringArray)
    .optional()
    .transform((arr) => arr?.[0]?.[0]),

  OS: z
    .array(stringArray)
    .optional()
    .transform((arr) => arr?.[0]?.[0]),

  SPECIMENVAR: z
    .array(z.array(z.string()).min(2))
    .optional()
    .transform((arr) => arr?.map((sv) => specimenVarSchema.parse(sv))),

  // Unofficial but common - free-form comments
  COMMENT: z
    .array(stringArray)
    .optional()
    .transform((arr) =>
      arr?.map((c) => c.join(", ")).filter((c) => c.length > 0),
    ),
});

const gefCptHeadersSchema = gefBaseHeadersSchema.extend({
  COLUMNMINMAX: z
    .array(z.tuple([z.coerce.number(), z.coerce.number(), z.coerce.number()]))
    .optional()
    .transform((arr) =>
      arr?.map(([columnNumber, min, max]) => ({ columnNumber, min, max })),
    ),
});

export type GefCptHeaders = z.infer<typeof gefCptHeadersSchema>;

const gefBoreHeadersSchema = gefBaseHeadersSchema.extend({
  SPECIMENTEXT: z
    .array(z.array(z.string()).min(2))
    .optional()
    .transform((arr) => arr?.map((st) => specimenTextSchema.parse(st))),
});

export type GefBoreHeaders = z.infer<typeof gefBoreHeadersSchema>;

/** Format Zod errors into user-friendly messages */
const formatIssue = (issue: $ZodIssue) => {
  const path = issue.path.length > 0 ? `#${issue.path.join(".")}: ` : "";

  return `${path}${issue.message}`;
};

export function parseGefCptHeaders(headersMap: GEFHeadersMap): GefCptHeaders {
  const headersObj = Object.fromEntries(headersMap);
  const result = gefCptHeadersSchema.safeParse(headersObj);

  if (!result.success) {
    // Format Zod errors into user-friendly messages
    const errors = result.error.issues.map((issue) => formatIssue(issue));
    throw new Error(errors.join("\n"));
  }

  return result.data;
}

export function parseGefBoreHeaders(headersMap: GEFHeadersMap): GefBoreHeaders {
  const headersObj = Object.fromEntries(headersMap);
  const result = gefBoreHeadersSchema.safeParse(headersObj);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => formatIssue(issue));
    throw new Error(errors.join("\n"));
  }

  return result.data;
}
