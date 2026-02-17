export {
  parseGefCptData,
  processCptMetadata,
  generateCptWarnings,
  parsePreExcavationLayers,
  findCptMeasurementVariable,
  detectGefExtension,
  findColumnByQuantity,
} from "./gef-cpt.js";

export type { GefExtension } from "./gef-cpt.js";
export type { GefCptHeaders } from "./gef-schemas.js";

export {
  broMeasurementVariables,
  broMeasurementTextVariables,
  
  klasse1MeasurementTextVariables,
  klasse1MeasurementVariables,
  
  votbMeasurementTextVariables,
  votbMeasurementVariables,

  belgianMeasurementVariables,
  belgianMeasurementTextVariables,
} from "./gef-cpt-spec.js";
