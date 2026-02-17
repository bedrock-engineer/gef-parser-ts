import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { strict as assert } from 'node:assert';
import { describe, test, before } from 'node:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import WASM init function
import initGefFileToMap from '../dist/wasm/gef_file_to_map.js';

// Import the parser
import { parseGefFile } from '../dist/index.js';

// Initialize WASM with the file buffer (for Node.js)
const wasmPath = join(__dirname, '../dist/wasm/gef_file_to_map_bg.wasm');
const wasmBuffer = readFileSync(wasmPath);
await initGefFileToMap({ module_or_path: wasmBuffer });

// Helper: parse a fixture file
async function parse(filename) {
  const content = readFileSync(join(__dirname, filename), 'utf-8');
  return parseGefFile(content, filename);
}

describe('CPT (example_cpt.gef)', async () => {
  const cpt = await parse('example_cpt.gef');

  test('fileType is CPT', () => {
    assert.equal(cpt.fileType, 'CPT');
  });

  test('has 586 data rows', () => {
    assert.equal(cpt.data.length, 586);
  });

  test('has 25 columns in columnInfo', () => {
    assert.equal(cpt.columnInfo.length, 25);
  });

  test('first row: sondeertrajectlengte is 0.3', () => {
    assert.equal(cpt.data[0]['sondeertrajectlengte'], 0.3);
  });

  test('first row: conusweerstand is 3.467', () => {
    assert.equal(cpt.data[0]['conusweerstand'], 3.467);
  });

  test('void values (-99999) are null', () => {
    assert.equal(cpt.data[0]['plaatselijke wrijving'], null);
    assert.equal(cpt.data[0]['wrijvingsgetal'], null);
  });

  test('company name is GeoDrillers', () => {
    assert.equal(cpt.processed.company?.name, 'GeoDrillers');
  });

  test('extension is bro', () => {
    assert.equal(cpt.processed.extension, 'bro');
  });

  test('location: coordinate system 31000 with WGS84 conversion', () => {
    assert.equal(cpt.processed.location?.coordinateSystem?.code, '31000');
    assert.equal(cpt.processed.location?.originalX, 155000.543);
    assert.equal(cpt.processed.location?.originalY, 463000.22);
    assert.notEqual(cpt.processed.location?.wgs84, null);
  });

  test('elevation: height system 31000, surface 2.01', () => {
    assert.equal(cpt.processed.elevation?.heightSystem?.code, '31000');
    assert.equal(cpt.processed.elevation?.surfaceElevation, 2.01);
  });

  test('processed.columns contains penetrationLength and measuredConeResistance', () => {
    assert.ok('penetrationLength' in cpt.processed.columns);
    assert.ok('measuredConeResistance' in cpt.processed.columns);
  });

  test('no missingRequiredColumn warnings', () => {
    const missing = cpt.warnings.filter(w => w.type === 'missingRequiredColumn');
    assert.equal(missing.length, 0);
  });
});

describe('BORE (example_bore.gef)', async () => {
  const bore = await parse('example_bore.gef');

  test('fileType is BORE', () => {
    assert.equal(bore.fileType, 'BORE');
  });

  test('has 13 layers', () => {
    assert.equal(bore.layers.length, 13);
  });

  test('first layer: depthTop 0, depthBottom 0.55, soilCode starts with Ks2h1', () => {
    assert.equal(bore.layers[0].depthTop, 0);
    assert.equal(bore.layers[0].depthBottom, 0.55);
    assert.ok(bore.layers[0].soilCode.startsWith('Ks2h1'));
  });

  test('last layer: depthTop 7.77, depthBottom 8.6, soilCode contains Zs1', () => {
    const last = bore.layers[bore.layers.length - 1];
    assert.equal(last.depthTop, 7.77);
    assert.equal(last.depthBottom, 8.6);
    assert.ok(last.soilCode.includes('Zs1'));
  });

  test('layer 2 description contains "Veen"', () => {
    assert.ok(bore.layers[2].description?.includes('Veen'));
  });

  test('company name is GeoDelft', () => {
    assert.equal(bore.processed.company?.name, 'GeoDelft');
  });

  test('testId contains BORING', () => {
    assert.ok(bore.processed.testId?.includes('BORING'));
  });

  test('has 3 specimens', () => {
    assert.equal(bore.processed.specimens.length, 3);
  });
});

describe('DISS (example_diss.gef)', async () => {
  const diss = await parse('example_diss.gef');

  test('fileType is DISS', () => {
    assert.equal(diss.fileType, 'DISS');
  });

  test('has 603 data rows', () => {
    assert.equal(diss.data.length, 603);
  });

  test('first row: verlopen tijd 0, conusweerstand 36.721', () => {
    assert.equal(diss.data[0]['verlopen tijd'], 0);
    assert.equal(diss.data[0]['conusweerstand'], 36.721);
  });

  test('parent reference is CPT000000036524A.gef', () => {
    assert.equal(diss.processed.parent?.reference, 'CPT000000036524A.gef');
  });

  test('testId is CPT000000036524, projectId is BRO', () => {
    assert.equal(diss.processed.testId, 'CPT000000036524');
    assert.equal(diss.processed.projectId, 'BRO');
  });

  test('surface elevation is 6.06', () => {
    assert.equal(diss.processed.elevation?.surfaceElevation, 6.06);
  });
});

describe('BORE (B61F3158.gef)', async () => {
  const bore2 = await parse('B61F3158.gef');

  test('fileType is BORE', () => {
    assert.equal(bore2.fileType, 'BORE');
  });

  test('has 4 layers', () => {
    assert.equal(bore2.layers.length, 4);
  });

  test('first layer: depthTop 0, depthBottom 3.5', () => {
    assert.equal(bore2.layers[0].depthTop, 0);
    assert.equal(bore2.layers[0].depthBottom, 3.5);
  });
});
