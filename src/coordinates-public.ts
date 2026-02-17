export { convertToWGS84 } from "./coordinates.js";
export type {
  WGS84Coords,
  CoordinateInput,
  CoordinateConversionResult,
} from "./coordinates.js";

export { addComputedDepthColumns } from "./depth-correction.js";
export type { CptRow as Row } from "./depth-correction.js";

export { COORDINATE_SYSTEMS, HEIGHT_SYSTEMS } from "./gef-schemas.js";

export {
  placeDeterminationCodes,
  heightDeterminationCodes,
} from "./location-codes.js";
