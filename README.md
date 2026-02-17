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

Parse a GEF file and automatically detect whether it's CPT or borehole data:

```typescript
import { parseGefFile } from "@bedrock-engineer/gef-parser";

// From a browser file input
const fileInput = document.querySelector('input[type="file"]');

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const gefData = await parseGefFile(file);

  switch (gefData.type) {
    case "CPT": {
      console.log("Cone resistance:", gefData.data.qc);
      console.log("Depth:", gefData.data.depth);
      console.log("Metadata:", gefData.metadata);
    }
    case "BORE": {
      gefData.data.forEach((layer) => {
        console.log(
          `${layer.soilCode} from ${layer.depthTop}m to ${layer.depthBottom}m`,
        );
      });
      console.log("Specimens:", gefData.specimens);
    }
    case "DISS": {
      console.log("Dissipation data:", gefData.data);
    }
  }
});
```

With Node.js reading GEF file from filesystem:

```ts
import { readFile } from "fs/promises";

const buffer = await readFile("path/to/file.gef");
const file = new File([buffer], "file.gef");
const gefData = await parseGefFile(file);

## API

### Main Functions

- `parseGefFile(file: File): Promise<GefData>` - Parse any GEF file
- `parseGefCptData()` - Parse CPT-specific data
- `processCptMetadata()` - Extract CPT metadata
- `parseGefBoreData()` - Parse borehole-specific data
- `processBoreMetadata()` - Extract borehole metadata
- `parseGefDissData()` - Parse DISS-specifc data

### Types

All types are exported from the main entry point:

```typescript
import type {
  GefData,
  GefCptData,
  GefBoreData,
  GefHeaders,
  ColumnInfo,
  GefDissData,
} from "@bedrock-engineer/gef-parser";
```

## License

Apache-2.0

By [Jules Blom](https://www.julesblom.com) at [Bedrock.engineer](https://bedrock.engineer)
