import { z } from "zod";
import {
  processCommonFields,
  type GEFHeadersMap,
  type ProcessedMeasurement,
  type ProcessedMetadata,
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
  type Parent,
} from "./gef-schemas.js";
import {
  detectGefExtension,
  type GefExtension,
} from "./gef-cpt.js";
import {
  cptMeasurementVariables,
  cptMeasurementTextVariables,
  belgianMeasurementTextVariables,
  belgianMeasurementVariables,
  dutchMeasurementTextVariables,
  dutchMeasurementVariables,
} from "./gef-cpt-spec.js";

export type DissRow = Record<string, number | string | null>;

export interface GefDissData {
  fileType: "DISS";
  data: Array<DissRow>;
  headers: GefDissHeaders;
  columnInfo: Array<ColumnInfo>;
  parent: Parent | undefined;
  warnings: Array<string>;
  processed: ProcessedMetadata;
}

export function parseGefDissData(
  dataString: string,
  headersMap: GEFHeadersMap,
) {
  const headers = parseGefDissHeaders(headersMap);

  const columnSeparator = headers.COLUMNSEPARATOR ?? /\s+/;
  const recordSeparator = headers.RECORDSEPARATOR ?? /\r?\n/;
  const columnInfo = headers.COLUMNINFO ?? [];
  const warnings: Array<string> = [];

  const hasTextColumn = headers.COLUMNTEXT?.[0] !== undefined;

  const records = dataString
    .split(recordSeparator)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  const recordLineNumbers: Array<number> = [];
  let currentLine = 1;
  for (const record of records) {
    recordLineNumbers.push(currentLine);
    currentLine += (record.match(/\n/g) ?? []).length + 1;
  }

  const voidValuesMap = new Map(
    headers.COLUMNVOID?.map(({ columnNumber, voidValue }) => [
      columnNumber,
      voidValue,
    ]) ?? [],
  );

  const data: Array<DissRow> = records.map((record, recordIndex) => {
    const lineNumber = recordLineNumbers[recordIndex];
    const rawValues = record
      .trim()
      .split(columnSeparator)
      .filter((val) => val.trim() !== "");

    const row: DissRow = {};

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
        warnings.push(
          `Line ${lineNumber}, record ${
            recordIndex + 1
          }, ${colName}: invalid number "${trimmed}" - setting to null`,
        );
        row[colName] = null;
        continue;
      }

      const voidValue = voidValuesMap.get(colIndex + 1);
      if (result.data === voidValue) {
        row[colName] = null;
        continue;
      }

      row[colName] = result.data;
    }

    // Handle optional text field
    if (rawValues.length > columnInfo.length) {
      const textValue = rawValues[columnInfo.length]?.trim();
      if (textValue) {
        if (hasTextColumn) {
          row.comment = textValue;
        } else {
          warnings.push(
            `Line ${lineNumber}, record ${
              recordIndex + 1
            }: found text value "${textValue}" but #COLUMNTEXT header is missing. Text field ignored.`,
          );
        }
      }
    }

    if (rawValues.length < columnInfo.length) {
      warnings.push(
        `Line ${lineNumber}, record ${recordIndex + 1}: found ${
          rawValues.length
        } columns but expected ${columnInfo.length}. Missing ${
          columnInfo.length - rawValues.length
        } column(s) - values set to null`,
      );
    }

    return row;
  });

  return {
    data,
    headers,
    columnInfo,
    warnings,
  };
}

function getDissTextVariablesForExtension(extension: GefExtension) {
  if (extension === "dutch") {
    return { ...cptMeasurementTextVariables, ...dutchMeasurementTextVariables };
  }
  if (extension === "belgian") {
    return {
      ...cptMeasurementTextVariables,
      ...belgianMeasurementTextVariables,
    };
  }
  return cptMeasurementTextVariables;
}

function getDissVarVariablesForExtension(extension: GefExtension) {
  if (extension === "dutch") {
    return { ...cptMeasurementVariables, ...dutchMeasurementVariables };
  }
  if (extension === "belgian") {
    return { ...cptMeasurementVariables, ...belgianMeasurementVariables };
  }
  return cptMeasurementVariables;
}

export function processDissMetadata(
  filename: string,
  headers: GefDissHeaders,
): ProcessedMetadata {
  const common = processCommonFields(filename, "DISS", headers);

  const extension = detectGefExtension(
    headers.MEASUREMENTTEXT?.map((mt) => mt.id),
    headers.MEASUREMENTVAR?.map((mv) => mv.id),
  );

  const measurementVarMetadata = getDissVarVariablesForExtension(extension);
  const measurementTextMetadata = getDissTextVariablesForExtension(extension);

  const measurements: Record<string, ProcessedMeasurement> = {};
  if (headers.MEASUREMENTVAR) {
    for (const mv of headers.MEASUREMENTVAR) {
      const varInfo =
        measurementVarMetadata[mv.id as keyof typeof measurementVarMetadata];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!varInfo || mv.value === undefined) {
        continue;
      }
      const key = getMeasurementVarKey(mv.id, measurementVarMetadata);
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
        measurementTextMetadata[mt.id as keyof typeof measurementTextMetadata];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!textInfo) {
        continue;
      }
      const measurementTextKey = getMeasurementTextKey(
        mt.id,
        measurementTextMetadata,
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
    measurements,
    texts,
  };
}

export function generateDissWarnings(
  filename: string,
  headers: GefDissHeaders,
): Array<string> {
  const warnings: Array<string> = [];

  if (!headers.COLUMNINFO) {
    return warnings;
  }

  const columnInfo = headers.COLUMNINFO;

  // Check for duplicate quantity numbers
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
      warnings.push(
        `File '${filename}' has duplicate quantity number ${quantityNum} assigned to columns ${colNums.join(
          ", ",
        )}. Each quantity should appear only once.`,
      );
    }
  }

  return warnings;
}
