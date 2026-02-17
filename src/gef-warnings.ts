// -- Common header warnings --

interface MissingHeaderWarning {
  type: "missingHeader";
  header: "ZID" | "XYID";
  filename: string;
}

interface UnknownHeightSystemWarning {
  type: "unknownHeightSystem";
  filename: string;
  heightCode: string;
}

interface ZidWithoutHeightWarning {
  type: "zidWithoutHeight";
  filename: string;
}

interface MissingColumnInfoQuantityWarning {
  type: "missingColumnInfoQuantity";
  filename: string;
  count: number;
}

// -- Data parsing warnings (CPT, BORE, DISS) --

interface InvalidNumberWarning {
  type: "invalidNumber";
  line: number;
  record: number;
  column: string;
  rawValue: string;
}

interface MissingColumnTextHeaderWarning {
  type: "missingColumnTextHeader";
  line: number;
  record: number;
  textValue: string;
}

interface MissingColumnsWarning {
  type: "missingColumns";
  line: number;
  record: number;
  found: number;
  expected: number;
}

interface ExtraColumnsWarning {
  type: "extraColumns";
  line: number;
  record: number;
  found: number;
  expected: number;
  extraValues: Array<string>;
}

// -- BORE-specific --

interface InvalidDepthWarning {
  type: "invalidDepth";
  line: number;
  record: number;
  depthTop: number;
  depthBottom: number;
}

interface InvertedDepthWarning {
  type: "invertedDepth";
  line: number;
  record: number;
  depthTop: number;
  depthBottom: number;
}

// -- CPT/DISS header warnings --

interface DuplicateQuantityWarning {
  type: "duplicateQuantity";
  filename: string;
  quantityNumber: number;
  quantityName: string;
  columns: Array<number>;
}

interface MissingRequiredColumnWarning {
  type: "missingRequiredColumn";
  filename: string;
  quantityNumber: number;
  quantityName: string;
}

interface ColumnMinMaxExceededWarning {
  type: "columnMinMaxExceeded";
  filename: string;
  columnNumber: number;
  columnName: string;
  actualMin: number;
  actualMax: number;
  declaredMin: number;
  declaredMax: number;
}

export type GefWarning =
  | MissingHeaderWarning
  | UnknownHeightSystemWarning
  | ZidWithoutHeightWarning
  | MissingColumnInfoQuantityWarning
  | InvalidNumberWarning
  | MissingColumnTextHeaderWarning
  | MissingColumnsWarning
  | ExtraColumnsWarning
  | InvalidDepthWarning
  | InvertedDepthWarning
  | DuplicateQuantityWarning
  | MissingRequiredColumnWarning
  | ColumnMinMaxExceededWarning;
