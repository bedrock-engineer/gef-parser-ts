# @bedrock-engineer/gef-parser

[![npm version](https://badge.fury.io/js/@bedrock-engineer%2Fgef-parser.svg)](https://www.npmjs.com/package/@bedrock-engineer/gef-parser)

A TypeScript library for parsing GEF (Geotechnical Exchange Format) files. GEF is the standard file format for exchanging geotechnical data in the Netherlands and Belgium, including Cone Penetration Test (CPT) measurements and borehole logs.

This parser handles the GEF format specification, coordinate transformations, and provides typed data structures for analysis and visualization. It uses the WebAssembly build of [gef-file-to-map](https://github.com/cemsbv/gef-file-to-map) for initial tokenization, with all CSV parsing, header validation, and domain logic implemented in TypeScript using zod.

**[Try the live demo](https://gef.bedrock.engineer)** | **[View example usage](https://github.com/bedrock-engineer/gef-app)**

## Features

- Parse GEF-CPT (Cone Penetration Test) files
- Parse GEF-DISS (Dissipation Test) files
- Parse GEF-BORE (Borehole) files with soil layers and specimens
- Automatic GEF type detection
- Support for [Dutch (BRO/VOTB)](https://votb.nl/wp-content/uploads/2016/02/180712-tekst-GEF-1.1.3-BRO-converter.pdf) and [Belgian (DOV) extensions](https://www.milieuinfo.be/confluence/x/5PQlC)
- Coordinate system conversion to WGS84
- Depth correction for inclinometer data
- TypeScript support with type definitions

GEF-SIEVE files are not supported.

## Installation

```bash
npm install @bedrock-engineer/gef-parser
```

## Usage

### Basic Parsing

`parseGefFile` takes the **file contents as a string** plus a filename, automatically detects
the GEF type, and returns a discriminated union you narrow on the **`fileType`** field:

```typescript
import { parseGefFile } from "@bedrock-engineer/gef-parser";

// From a browser file input
const fileInput = document.querySelector('input[type="file"]');

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const content = await file.text();
  const gefData = await parseGefFile(content, file.name);

  switch (gefData.fileType) {
    case "CPT": {
      // gefData.data is an array of measurement rows. Columns are keyed by
      // semantic name (derived from the file's COLUMNINFO definitions, also
      // available as gefData.columnInfo). trueDepth and elevation are computed.
      for (const row of gefData.data) {
        console.log("cone resistance qc:", row.qc);
        console.log("true depth:", row.trueDepth, "elevation:", row.elevation);
      }
      break;
    }
    case "BORE": {
      gefData.layers.forEach((layer) => {
        console.log(
          `${layer.soilCode} from ${layer.depthTop}m to ${layer.depthBottom}m`,
        );
      });
      console.log("Specimens:", gefData.processed.specimens);
      break;
    }
    case "DISS": {
      console.log("Dissipation rows:", gefData.data);
      break;
    }
  }

  // All result types also carry `.headers`, `.warnings`, and `.processed` metadata.
  console.log(gefData.warnings); // Array<GefWarning> non-fatal parsing/validation issues
});
```

In Node.js, read the file as text and pass it along with a filename:

```ts
import { readFile } from "node:fs/promises";
import { parseGefFile } from "@bedrock-engineer/gef-parser";

const content = await readFile("path/to/file.gef", "utf-8");
const gefData = await parseGefFile(content, "file.gef");
```

## API

### Main Functions

- `parseGefFile(gefContent: string, filename: string): Promise<GefData>` — parse any GEF file (CPT/BORE/DISS), auto-detecting the type
- `parseGefCptData()` / `processCptMetadata()` — parse CPT data / extract CPT metadata
- `parseGefBoreData()` / `processBoreMetadata()` — parse borehole data / extract borehole metadata
- `parseGefDissData()` / `processDissMetadata()` — parse dissipation data / extract DISS metadata
- `formatGefDate()` / `formatGefTime()` — format GEF date/time structures
- `convertToWGS84()` (from `@bedrock-engineer/gef-parser/coordinates`) — coordinate conversion (also applied automatically during parsing)

### Result shape

`GefData` is a union discriminated on `fileType`:

| `fileType` | Type          | Measurement data      | Notes                                                          |
| ---------- | ------------- | --------------------- | -------------------------------------------------------------- |
| `"CPT"`    | `GefCptData`  | `data: CptRow[]`      | also `columnInfo`; `trueDepth`/`elevation` added automatically |
| `"BORE"`   | `GefBoreData` | `layers: BoreLayer[]` | specimens at `processed.specimens`                             |
| `"DISS"`   | `GefDissData` | `data: DissRow[]`     | also `columnInfo`                                              |

Every variant additionally has `headers`, `warnings: GefWarning[]`, and `processed` metadata.

### Types

Types are exported from the main entry point:

```typescript
import type {
  GefData,
  GefFileType,
  GefCptData,
  GefBoreData,
  GefDissData,
  BoreLayer,
  BoreSpecimen,
  PreExcavationLayer,
  DissRow,
  GefCptHeaders,
  GefBoreHeaders,
  GefDissHeaders,
  ColumnInfo,
  GefWarning,
} from "@bedrock-engineer/gef-parser";
```

Subpath exports are also available: `@bedrock-engineer/gef-parser/cpt`, `/bore`,
`/bore-codes`, `/diss`, and `/coordinates`.

## License

Apache-2.0

[Bedrock.engineer](https://bedrock.engineer)
