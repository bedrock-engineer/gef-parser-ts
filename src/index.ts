// Functions
export { parseGefFile } from "./gef-common.js";
export { formatGefDate, formatGefTime } from "./gef-metadata-processed.js";

// Result types
export type { GefWarning } from "./gef-warnings.js";

export type {
  GefData,
  GefFileType,
  ProcessedMetadata,
  ProcessedMetadataBase,
  ProcessedCptMetadata,
  ProcessedBoreMetadata,
  ProcessedDissMetadata,
  ProcessedLocation,
  ProcessedElevation,
  ProcessedCompany,
  ProcessedColumn,
  ProcessedItemMetadata,
  ProcessedMeasurement,
  ProcessedText,
} from "./gef-common.js";

export type { GefCptData, PreExcavationLayer } from "./gef-cpt.js";
export type { GefBoreData, BoreLayer, BoreSpecimen } from "./gef-bore.js";
export type { GefDissData, DissRow } from "./gef-diss.js";

// Header/schema types
export type {
  GefCptHeaders,
  GefBoreHeaders,
  GefDissHeaders,
  Parent,
  Child,
  ColumnInfo,
  MeasurementVar,
  MeasurementText,
  GefDate,
  GefTime,
  CoordinateSystemCode,
  HeightSystemCode,
  XYID,
  ZID,
  GefId,
  ReportCode,
  CompanyId,
  SpecimenVar,
  SpecimenText,
} from "./gef-schemas.js";
