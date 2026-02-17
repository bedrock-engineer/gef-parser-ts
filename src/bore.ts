export {
  parseGefBoreData,
  processBoreMetadata,
  parseGefBoreSpecimens,
  getSoilColor,
  SOIL_COLORS,
  formatSpecimenCode,
  findBoreMeasurementVariable,
} from "./gef-bore.js";

export type { GefBoreHeaders } from "./gef-schemas.js";

export {
  SPECIMEN_CODES,
  boreMeasurementTextVariables,
  boreMeasurementVariables,
} from "./gef-bore-spec.js";

export type {
  SpecimenCode,
  BoreMeasurementTextVariable,
  BoreMeasurementVariable,
} from "./gef-bore-spec.js";
