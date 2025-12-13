import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import WASM init function
import initGefFileToMap from '../dist/wasm/gef_file_to_map.js';

// Import the parser
import { parseGefFile } from '../dist/index.js';

// Create a File-like object for Node.js
class NodeFile {
  constructor(path) {
    this.path = path;
    this.name = path.split('/').pop();
    this._content = readFileSync(path, 'utf-8');
  }

  text() {
    return Promise.resolve(this._content);
  }
}

// Initialize WASM with the file buffer (for Node.js)
const wasmPath = join(__dirname, '../dist/wasm/gef_file_to_map_bg.wasm');
const wasmBuffer = readFileSync(wasmPath);
await initGefFileToMap({ module_or_path: wasmBuffer });

async function runTests() {
  console.log('Running GEF parser tests...\n');

  const testFiles = [
    'example_cpt.gef',
    'example_bore.gef'
  ];

  let passed = 0;
  let failed = 0;

  for (const fileName of testFiles) {
    const filePath = join(__dirname, fileName);
    try {
      console.log(`Testing ${fileName}...`);
      const file = new NodeFile(filePath);
      const result = await parseGefFile(file);

      if (!result) {
        throw new Error('No result returned');
      }

      // Check fileType instead of type (CPT and BORE data use fileType)
      if (!result.fileType) {
        console.error('Result structure:', Object.keys(result));
        throw new Error('Result missing fileType field');
      }

      console.log(`  ✓ Parsed successfully (type: ${result.fileType})`);
      passed++;
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
      console.error(error.stack);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
