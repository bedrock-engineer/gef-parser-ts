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
import { parseSoilCode, parseSoilDescription, decodeBoreCode, describeSoilCode, getSoilCodeFromDescription, NEN5104_SOIL_CODES } from '../dist/bore-codes.js';

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

  test('pre-excavation layers are hydrated like borehole soils', () => {
    const layers = cpt.processed.preExcavationLayers;
    assert.equal(layers.length, 3);
    // "matig vast klei zwak siltig": "matig vast" is consistency, not admixture
    assert.equal(layers[0].soilCode, 'Ks1');
    assert.equal(layers[0].soil.main, 'K');
    assert.deepEqual(layers[0].soil.admixtures, [{ letter: 's', grade: 1 }]);
    assert.equal(layers[0].soilText, 'Klei, zwak siltig');
    assert.equal(layers[1].soilCode, 'Lz1');
    // "matig fijn" is a grain-size class, not an admixture grade
    assert.equal(layers[2].soilCode, 'Zs1');
  });
});

describe('soil description parsing (parseSoilDescription)', () => {
  test('returns the structure directly, lithology is the derived code', () => {
    const soil = parseSoilDescription('klei zwak siltig, sterk humeus');
    assert.equal(soil.lithology, 'Ks1h3');
    assert.equal(soil.main, 'K');
    assert.deepEqual(soil.admixtures, [
      { letter: 's', grade: 1 },
      { letter: 'h', grade: 3 },
    ]);
  });

  test('a description that already is a code parses as that code', () => {
    const soil = parseSoilDescription('Kz2');
    assert.equal(soil.lithology, 'Kz2');
    assert.deepEqual(soil.admixtures, [{ letter: 'z', grade: 2 }]);
  });
});

describe('soil code from description (getSoilCodeFromDescription)', () => {
  test('main soil with graded admixture', () => {
    assert.equal(getSoilCodeFromDescription('klei sterk humeus'), 'Kh3');
    assert.equal(getSoilCodeFromDescription('leem zwak zandig'), 'Lz1');
  });

  test('adjectives do not hijack the main soil', () => {
    // "kleiig" must not match as main soil "klei"
    assert.equal(getSoilCodeFromDescription('Zand, zwak kleiig'), 'Zk1');
    assert.equal(getSoilCodeFromDescription('veen zwak zandig'), 'Vz1');
  });

  test('multiple admixtures accumulate in source order', () => {
    assert.equal(
      getSoilCodeFromDescription('zand, uiterst grindig, zwak humeus'),
      'Zg4h1',
    );
  });

  test('ungraded adjective becomes an ungraded letter', () => {
    assert.equal(getSoilCodeFromDescription('klei zandig'), 'Kz');
    assert.equal(getSoilCodeFromDescription('veen mineraalarm'), 'Vm');
  });

  test('non-standard synonyms map to standard letters', () => {
    assert.equal(getSoilCodeFromDescription('zand zwak lemig'), 'Zs1');
    assert.equal(getSoilCodeFromDescription('klei matig venig'), 'Kh2');
  });

  test('inflected adjective-first phrasing is recognised', () => {
    assert.equal(getSoilCodeFromDescription('sterk zandige klei'), 'Kz3');
    assert.equal(getSoilCodeFromDescription('humeuze klei'), 'Kh');
    assert.equal(getSoilCodeFromDescription('zwak siltige leem'), 'L');
  });

  test('adjectives restating the main soil are skipped', () => {
    assert.equal(getSoilCodeFromDescription('leem zwak lemig'), 'L');
    assert.equal(getSoilCodeFromDescription('veen sterk humeus'), 'V');
  });

  test('a description that already is a code passes through', () => {
    assert.equal(getSoilCodeFromDescription('Kz2'), 'Kz2');
    assert.equal(getSoilCodeFromDescription('NBE'), 'NBE');
  });

  test('unrecognised text falls back to NBE', () => {
    assert.equal(getSoilCodeFromDescription('puin'), 'NBE');
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

  test('first layer is hydrated: soil structure from soilCode', () => {
    const soil = bore.layers[0].soil;
    assert.equal(soil.main, 'K');
    assert.deepEqual(soil.admixtures, [
      { letter: 's', grade: 2 },
      { letter: 'h', grade: 1 },
    ]);
  });

  test('first layer soilText is the decoded Dutch description', () => {
    assert.ok(
      bore.layers[0].soilText.startsWith('Klei, matig siltig, zwak humeus'),
    );
  });

  test('soilText excludes the free-text driller remark (stays in description)', () => {
    const layer = bore.layers[2];
    // The remark lives in `description`, not in the decoded `soilText`.
    assert.ok(layer.description?.includes('Veen van NAP'));
    assert.ok(!layer.soilText.includes('Veen van NAP'));
    // Coded additions (layering, shells, stratigraphy) DO decode into soilText.
    assert.ok(layer.soilText.includes('met zandlagen'));
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

describe('soil code grammar (parseSoilCode)', () => {
  test('composite code: main soil + graded admixtures', () => {
    const parsed = parseSoilCode('Ks1h3');
    assert.equal(parsed.main, 'K');
    assert.deepEqual(parsed.admixtures, [
      { letter: 's', grade: 1 },
      { letter: 'h', grade: 3 },
    ]);
    assert.deepEqual(parsed.qualifiers, []);
  });

  test('trailing qualifier is split off the lithology', () => {
    const parsed = parseSoilCode('Zs1 GCZ');
    assert.equal(parsed.lithology, 'Zs1');
    assert.equal(parsed.main, 'Z');
    assert.deepEqual(parsed.qualifiers, ['GCZ']);
  });

  test('ungraded admixture has undefined grade', () => {
    const parsed = parseSoilCode('Vm');
    assert.equal(parsed.main, 'V');
    assert.deepEqual(parsed.admixtures, [{ letter: 'm', grade: undefined }]);
  });

  test('special codes (uppercase second letter) are not decomposed', () => {
    assert.equal(parseSoilCode('NBE').main, '');
    assert.equal(parseSoilCode('GM').main, ''); // grind letter, but "geen monster"
  });
});

describe('soil code decoding (decodeBoreCode)', () => {
  test('whole-token dictionary hit', () => {
    assert.equal(decodeBoreCode('Ks1'), 'Klei, zwak siltig');
    assert.equal(decodeBoreCode('Vm'), 'Veen, mineraalarm');
    assert.equal(decodeBoreCode('NBE'), 'niet benoemd');
  });

  test('composite code is composed from its parts', () => {
    assert.equal(decodeBoreCode('Ks1h3'), 'Klei, zwak siltig, sterk humeus');
    assert.equal(decodeBoreCode('Ks2h1'), 'Klei, matig siltig, zwak humeus');
  });

  test('trailing qualifier is appended', () => {
    assert.equal(decodeBoreCode('Zs1 GCZ'), 'Zand, zwak siltig, glauconietzand');
  });

  test('unrecognized code is returned unchanged', () => {
    assert.equal(decodeBoreCode('QQ'), 'QQ');
  });

  test('veen grade 3 composes as "matig" per Tabel 2.15', () => {
    assert.equal(decodeBoreCode('Vk3'), 'Veen, matig kleiig');
    assert.equal(decodeBoreCode('Vk3h2'), 'Veen, matig kleiig, matig humeus');
    assert.equal(decodeBoreCode('Vz3g1'), 'Veen, matig zandig, zwak grindig');
  });

  test('describeSoilCode renders an already-parsed code identically', () => {
    assert.equal(
      describeSoilCode(parseSoilCode('Zs1 GCZ')),
      decodeBoreCode('Zs1 GCZ'),
    );
  });

  test('stratigraphic unit qualifier is decoded', () => {
    assert.equal(decodeBoreCode('Zs1 BX'), 'Zand, zwak siltig, Formatie van Boxtel');
    assert.equal(decodeBoreCode('Ks1 EE'), 'Klei, zwak siltig, Eem Formatie');
  });

  test('colour qualifiers win the BR/GE/DO collision with stratigraphy', () => {
    assert.equal(decodeBoreCode('Ks1 GE'), 'Klei, zwak siltig, geel');
    assert.equal(decodeBoreCode('Zs1 BR'), 'Zand, zwak siltig, bruin');
    assert.equal(decodeBoreCode('Vm DO GN'), 'Veen, mineraalarm, donker, groen');
  });

  test('a lone non-soil dictionary code still decodes', () => {
    assert.equal(decodeBoreCode('STZL'), 'met zandlagen');
    assert.equal(decodeBoreCode('GE'), 'geel');
    assert.equal(decodeBoreCode('NA'), 'Formatie van Naaldwijk');
  });
});

describe('Tabel 2.15 text matches the composed grammar', () => {
  // Appending a toevoeging forces the compose path (the bare code hits the
  // whole-token lookup), so this catches any drift between the verbatim spec
  // table and the vocabulary-based composition.
  for (const [code, text] of Object.entries(NEN5104_SOIL_CODES)) {
    if (parseSoilCode(code).main === '') continue; // GM, NBE, g1..h3
    test(`${code}h2 composes to "${text}, matig humeus"`, () => {
      assert.equal(decodeBoreCode(`${code}h2`), `${text}, matig humeus`);
    });
  }
});

