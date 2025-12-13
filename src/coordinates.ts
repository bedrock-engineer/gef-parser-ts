import proj4 from "proj4";
import {
  COORDINATE_SYSTEMS,
  type CoordinateSystemCode,
} from "./gef-schemas.js";

export interface WGS84Coords {
  lat: number;
  lon: number;
}

export interface CoordinateInput {
  coordinateSystem: CoordinateSystemCode;
  x: number;
  y: number;
}

export type CoordinateConversionResult =
  | { success: true; coords: WGS84Coords }
  | { success: false; error: string };

/**
 * Convert coordinates from a GEF coordinate system to WGS84 (EPSG:4326)
 * Returns result object with success flag and either coords or error message
 */
export function convertToWGS84(
  input: CoordinateInput,
): CoordinateConversionResult {
  const coordSysConfig = COORDINATE_SYSTEMS[input.coordinateSystem];
  if (!coordSysConfig.epsg) {
    return {
      success: false,
      error: `Coordinate system ${input.coordinateSystem} (${coordSysConfig.name}) does not have an EPSG code defined - cannot convert to WGS84`,
    };
  }

  try {
    // Define custom projection if needed
    if ("proj4def" in coordSysConfig) {
      proj4.defs(coordSysConfig.epsg, coordSysConfig.proj4def);
    }

    const [lon, lat] = proj4(coordSysConfig.epsg, "EPSG:4326", [
      input.x,
      input.y,
    ]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return {
        success: false,
        error: `Coordinate conversion resulted in invalid values (lat: ${lat}, lon: ${lon}) for input (x: ${input.x}, y: ${input.y}) in ${coordSysConfig.epsg}`,
      };
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return {
        success: false,
        error: `Converted coordinates (lat: ${lat}, lon: ${lon}) are out of valid WGS84 bounds (lat: -90 to 90, lon: -180 to 180)`,
      };
    }

    return { success: true, coords: { lat, lon } };
  } catch (error) {
    return {
      success: false,
      error: `proj4 conversion failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
