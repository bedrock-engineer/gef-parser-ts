import {
  buildColumnMap,
  checkDuplicateQuantities,
  parseGefRecords,
  processCommonFields,
  type GEFHeadersMap,
  type ProcessedMeasurement,
  type ProcessedDissMetadata,
  type ProcessedText,
} from "./gef-common.js";
import {
  getMeasurementTextKey,
  getMeasurementVarKey,
} from "./gef-measurement-mappings.js";
import {
  parseGefDissHeaders,
  type ColumnInfo,
  type GefDissHeaders,
} from "./gef-schemas.js";
import {
  cptMeasurementVariables,
  cptMeasurementTextVariables,
  cptColumnQuantities,
} from "./gef-cpt-spec.js";
import type { GefWarning } from "./gef-warnings.js";

export type DissRow = Record<string, number | string | null>;

export interface GefDissData {
  fileType: "DISS";
  data: Array<DissRow>;
  headers: GefDissHeaders;
  columnInfo: Array<ColumnInfo>;
  warnings: Array<GefWarning>;
  processed: ProcessedDissMetadata;
}

export function parseGefDissData(
  dataString: string,
  headersMap: GEFHeadersMap,
) {
  const headers = parseGefDissHeaders(headersMap);

  const columnSeparator = headers.COLUMNSEPARATOR ?? /\s+/;
  const recordSeparator = headers.RECORDSEPARATOR ?? /\r?\n/;
  const columnInfo = headers.COLUMNINFO ?? [];

  const voidValuesMap = new Map(
    headers.COLUMNVOID?.map(({ columnNumber, voidValue }) => [
      columnNumber,
      voidValue,
    ]) ?? [],
  );

  const { rows, warnings } = parseGefRecords(dataString, {
    columnSeparator,
    recordSeparator,
    columnInfo,
    voidValues: voidValuesMap,
    hasTextColumn: headers.COLUMNTEXT?.[0] !== undefined,
  });
  const data = rows as Array<DissRow>;

  return {
    data,
    headers,
    columnInfo,
    warnings,
  };
}

export function processDissMetadata(
  filename: string,
  headers: GefDissHeaders,
  columnInfo: Array<ColumnInfo>,
): ProcessedDissMetadata {
  const common = processCommonFields(filename, "DISS", headers);

  const measurements: Record<string, ProcessedMeasurement> = {};
  if (headers.MEASUREMENTVAR) {
    for (const mv of headers.MEASUREMENTVAR) {
      const varInfo =
        cptMeasurementVariables[mv.id as keyof typeof cptMeasurementVariables];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!varInfo || mv.value === undefined) {
        continue;
      }
      const key = getMeasurementVarKey(mv.id, cptMeasurementVariables);
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

  const texts: Record<string, ProcessedText> = {};
  
  if (headers.MEASUREMENTTEXT) {
    for (const mt of headers.MEASUREMENTTEXT) {
      const textInfo =
        cptMeasurementTextVariables[mt.id as keyof typeof cptMeasurementTextVariables];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!textInfo) {
        continue;
      }
      const measurementTextKey = getMeasurementTextKey(
        mt.id,
        cptMeasurementTextVariables,
      );
      if (measurementTextKey) {
        texts[measurementTextKey] = {
          value: mt.text,
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
    fileType: "DISS",
    columns: buildColumnMap(columnInfo, cptColumnQuantities),
    parent: headers.PARENT,
    measurements,
    texts,
  };
}

export function generateDissWarnings(
  filename: string,
  headers: GefDissHeaders,
): Array<GefWarning> {
  const warnings: Array<GefWarning> = [];

  if (!headers.COLUMNINFO) {
    return warnings;
  }

  const columnInfo = headers.COLUMNINFO;

  warnings.push(
    ...checkDuplicateQuantities(filename, columnInfo, cptColumnQuantities),
  );

  return warnings;
}
