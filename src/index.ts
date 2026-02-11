export { parseGefFile } from "./gef-common.js";

export type {
  GefData,
  GefFileType,
  ProcessedItemMetadata,
  ProcessedMeasurement,
  ProcessedText,
  ProcessedMetadata,
} from "./gef-common.js";

export {
  parseGefCptData,
  processCptMetadata,
  generateCptWarnings,
  parsePreExcavationLayers,
  findCptMeasurementVariable,
  detectGefExtension,
  findColumnByQuantity,
} from "./gef-cpt.js";

export {
  dutchMeasurementVariables,
  belgianMeasurementVariables,
  dutchMeasurementTextVariables,
  belgianMeasurementTextVariables,
} from "./gef-cpt-spec.js";

export {
  parseGefBoreData,
  processBoreMetadata,
  parseGefBoreSpecimens,
  getSoilColor,
  SOIL_COLORS,
  formatSpecimenCode,
  findBoreMeasurementVariable,
} from "./gef-bore.js";

export {
  parseGefDissData,
  processDissMetadata,
  generateDissWarnings,
} from "./gef-diss.js";

export type { GefDissData, DissRow } from "./gef-diss.js";

export {
  SPECIMEN_CODES,
  SpecimenCode,
  BoreMeasurementTextVariable,
  BoreMeasurementVariable,
  boreMeasurementTextVariables,
  boreMeasurementVariables,
} from "./gef-bore-spec.js";

export type {
  GefCptData,
  PreExcavationLayer,
  GefExtension,
} from "./gef-cpt.js";

export type { GefBoreData, BoreLayer, BoreSpecimen } from "./gef-bore.js";

export type {
  GefCptHeaders,
  GefBoreHeaders,
  GefDissHeaders,
  Parent,
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

// Constants
export { COORDINATE_SYSTEMS, HEIGHT_SYSTEMS } from "./gef-schemas.js";

// Utilities
export { convertToWGS84 } from "./coordinates.js";
export type {
  WGS84Coords,
  CoordinateInput,
  CoordinateConversionResult,
} from "./coordinates.js";
export { addComputedDepthColumns } from "./depth-correction.js";
export type { Row } from "./depth-correction.js";
export {
  getMeasurementVarKey,
  getMeasurementTextKey,
} from "./gef-measurement-mappings.js";
export { formatGefDate, formatGefTime } from "./gef-metadata-processed.js";

// Codes and constants from gef-bore-codes
export {
  decodeBoreCode,
  getSoilCodeFromDescription,
  NEN5104_SOIL_CODES,
  NON_STANDARD_SOIL_CODES,
  ADDITIONAL_SOIL_CODES,
  SECONDARY_COLORS,
  MAIN_COLORS,
  SAND_MEDIAN_CLASSES,
  SAND_SPREAD,
  GRAIN_SHAPE,
  GRAVEL_MEDIAN_CLASSES,
  GRAVEL_FRACTIONS,
  PEAT_AMORPHOSITY,
  PEAT_TYPES,
  CONSISTENCY,
  SAND_COMPACTION,
  ROCK_HARDNESS,
  SHELL_CONTENT,
  CALCIUM_CONTENT,
  GLAUCONITE_CONTENT,
  ANTHROPOGENIC_ADMIXTURES,
  LAYERING,
  GEOLOGICAL_INTERPRETATION,
  STRATIGRAPHIC_UNITS,
} from "./gef-bore-codes.js";

export {
  placeDeterminationCodes,
  heightDeterminationCodes,
} from "./location-codes.js";
