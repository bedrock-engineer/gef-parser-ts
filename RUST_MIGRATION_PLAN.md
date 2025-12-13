# GEF Parser Rust Migration Plan

## Context

Current architecture grew organically by building on top of `gef-file-to-map` WASM tokenizer. Now we need a Python parser too, making a full Rust rewrite worthwhile.

## Current Architecture (Inefficient)

```
GEF File (string)
    ↓
[RUST/WASM] parse_gef_wasm()
    ↓
{data: "CSV string", headers: Map<string, string[][]>}  ← serialized across boundary
    ↓
[JAVASCRIPT] parseGefCptData() / parseGefBoreData()
    ↓
- Re-parse CSV string → numbers
- Re-parse header strings → Zod schemas
- Validate, transform, enrich
- Depth correction
- Coordinate conversion
    ↓
Final typed output
```

**Problem**: Redundant work across WASM boundary
- WASM scans entire file, JS re-parses it
- Headers split into string arrays, then Zod re-parses them
- Large data string serialized across boundary unnecessarily

## Target Architecture (Clean)

```
GEF File (string)
    ↓
[RUST CORE] Full parsing pipeline
    ↓
- Parse headers → typed structs
- Parse CSV data → Vec<DataRow>
- Validate schemas (serde)
- Apply void values
- Depth correction (inclination math)
- Normalize depths
- Extension detection
- Spec table lookups
- Generate warnings
    ↓
Fully parsed, typed data structure
    ↓
[WASM/PyO3] Export to host language
    ↓
[HOST WRAPPER] Only coordinate conversion
    ↓
- JS: proj4
- Python: pyproj
```

## Responsibility Split

### Rust Core (95% of work)

**Parsing:**
- Full GEF file parsing (headers + data)
- CSV parsing with configurable separators
- Number coercion and validation
- Schema validation (serde)

**Business Logic:**
- Void value handling (column-specific null markers)
- Depth normalization (negative → positive)
- Extension detection (Dutch BRO/VOTB, Belgian DOV, standard)
- Duplicate detection
- Pre-excavation layer parsing
- Specimen parsing (bore files)

**Post-Processing:**
- **Depth correction** (inclination + trigonometry)
- Elevation calculation (except WGS84 coords)
- Layer validation (inverted layers, NaN checks)

**Metadata:**
- All spec table lookups (2,446 lines)
- Measurement variable decoding
- Text variable decoding
- Soil code lookups

**Output:**
- Warning generation
- Human-readable metadata enrichment

### Host Language (5% of work)

**JavaScript:**
- Coordinate conversion (proj4 library)
- Thin wrapper around WASM

**Python:**
- Coordinate conversion (pyproj library)
- Thin wrapper around PyO3

## Depth Correction: Why Rust

Current JS implementation (`depth-correction.ts:202`):
```typescript
correctionFactor = Math.cos((inclinationDeg * Math.PI) / 180)
```

Rust equivalent:
```rust
fn calculate_corrected_depth(
    data: &[DataRow],
    inclination_deg: Option<f64>,
    pre_excavation_depth: f64,
) -> Vec<CorrectedRow> {
    let correction_factor = inclination_deg
        .map(|deg| deg.to_radians().cos())
        .unwrap_or(1.0);

    data.iter().map(|row| {
        let true_depth = row.depth * correction_factor;
        let elevation = row.reference_height - true_depth;
        // ... cumulative depth, void handling
    }).collect()
}
```

**Why in Rust:**
- Pure math (no external dependencies)
- Performance benefit for large datasets
- Type safety for void value handling
- Keeps all data processing in one place

## Coordinate Conversion: Why Host Language

**Why NOT in Rust:**
- proj4/pyproj are mature, battle-tested libraries
- Complex coordinate systems with edge cases
- WASM proj4 port would be significant effort
- Different libraries for JS vs Python anyway
- Minimal performance impact (one calculation per file)

**Keep it simple:** Let host languages use their native proj libs.

## API Design

### Rust Core

```rust
// Core data types
pub struct ParsedGefFile {
    pub file_type: FileType,
    pub headers: Headers,  // Already typed (CPT or Bore)
    pub data: Vec<DataRow>, // With trueDepth, elevation (pre-coord conversion)
    pub column_info: Vec<ColumnInfo>,
    pub warnings: Vec<String>,
    pub metadata: Metadata,
}

pub enum FileType {
    CPT,
    BORE,
}

pub struct DataRow {
    pub depth: f64,
    pub true_depth: f64,
    pub elevation: f64,  // Calculated from reference height
    pub is_void: bool,
    pub values: HashMap<String, f64>,  // Dynamic columns
}

// Main API
pub fn parse_gef(content: &str) -> Result<ParsedGefFile, ParseError>
```

### JavaScript Wrapper

```typescript
import { parse_gef } from './wasm/gef_parser.js';
import { convertToWGS84 } from './coordinates.js';

export async function parseGefFile(file: File) {
  const content = await file.text();
  const parsed = parse_gef(content);  // WASM call - does everything

  // Only add coordinate conversion
  if (parsed.headers.xyid) {
    const result = convertToWGS84({
      coordinateSystem: parsed.headers.xyid.coordinateSystem,
      x: parsed.headers.xyid.x,
      y: parsed.headers.xyid.y,
    });
    parsed.wgs84 = result.success ? result.coords : null;
    parsed.wgs84Error = result.success ? null : result.error;
  }

  return parsed;
}
```

### Python Wrapper

```python
from gef_parser import parse_gef
from pyproj import Transformer

def parse_gef_file(content: str):
    parsed = parse_gef(content)  # PyO3 call - does everything

    # Only add coordinate conversion
    if parsed.headers.xyid:
        parsed.wgs84 = convert_to_wgs84(
            parsed.headers.xyid.coordinate_system,
            parsed.headers.xyid.x,
            parsed.headers.xyid.y
        )

    return parsed
```

## Project Structure

```
gef-parser/                    # Rust workspace root
├── Cargo.toml                 # Workspace manifest
│
├── gef-core/                  # Core Rust library
│   ├── Cargo.toml
│   ├── build.rs               # Code generation from JSON specs
│   ├── src/
│   │   ├── lib.rs
│   │   ├── parser.rs          # Main parsing logic
│   │   ├── schemas.rs         # Serde structs (headers, etc.)
│   │   ├── cpt.rs             # CPT-specific parsing
│   │   ├── bore.rs            # Bore-specific parsing
│   │   ├── depth.rs           # Depth correction logic
│   │   ├── validation.rs      # Schema validation
│   │   ├── warnings.rs        # Warning generation
│   │   └── generated/         # Auto-generated from JSON
│   │       ├── specs.rs       # Generated at build time
│   │       └── mod.rs
│   └── specs/                 # JSON spec files (single source of truth)
│       ├── cpt-quantities.json
│       ├── measurement-variables.json
│       ├── bore-soil-codes.json
│       └── schema.json        # JSON schema for spec files
│
├── gef-wasm/                  # WASM bindings for JavaScript
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs             # wasm-bindgen exports
│
├── gef-py/                    # Python bindings
│   ├── Cargo.toml
│   ├── pyproject.toml         # maturin config
│   └── src/
│       └── lib.rs             # PyO3 exports
│
└── wrappers/
    ├── js/                    # JavaScript wrapper package
    │   ├── package.json
    │   ├── src/
    │   │   ├── index.ts
    │   │   └── coordinates.ts # proj4 wrapper
    │   └── wasm/              # Built WASM files copied here
    │
    └── python/                # Python wrapper package
        ├── setup.py
        └── gef_parser/
            ├── __init__.py
            └── coordinates.py # pyproj wrapper
```

## Spec Data Management

### JSON as Source of Truth

Store all spec tables as JSON (easy to edit, language-agnostic):

**`specs/cpt-quantities.json`:**
```json
[
  {
    "id": 1,
    "name": "penetrationLength",
    "unit": "m",
    "description": "Penetration length"
  },
  {
    "id": 2,
    "name": "coneResistance",
    "unit": "MPa",
    "description": "Cone resistance"
  }
]
```

### Build-Time Code Generation

**`build.rs`:**
```rust
fn main() {
    // Read JSON specs
    let specs = read_specs_from_json();

    // Generate Rust const data
    let generated_code = generate_rust_specs(specs);

    // Write to OUT_DIR
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    fs::write(out_path.join("generated_specs.rs"), generated_code).unwrap();
}
```

**Generated output (`generated/specs.rs`):**
```rust
pub const CPT_QUANTITIES: &[QuantitySpec] = &[
    QuantitySpec {
        id: 1,
        name: "penetrationLength",
        unit: "m",
        description: "Penetration length",
    },
    QuantitySpec {
        id: 2,
        name: "coneResistance",
        unit: "MPa",
        description: "Cone resistance",
    },
];
```

**Benefits:**
- ✅ Easy to maintain (edit JSON, not Rust)
- ✅ Zero runtime cost (compiled into binary)
- ✅ Type-safe (Rust compiler validates)
- ✅ No file bundling (data baked into WASM/wheel)
- ✅ Single source of truth
- ✅ Can validate JSON with schema

## Migration Strategy

### Phase 1: Setup & Foundation (Week 1)

1. **Create Rust workspace structure**
   - Set up cargo workspace
   - Add gef-core, gef-wasm, gef-py crates
   - Configure build.rs for spec generation

2. **Port spec tables to JSON**
   - Extract from TypeScript to JSON files
   - Create JSON schema for validation
   - Write build.rs code generator
   - Verify generated Rust compiles

3. **Define core types**
   - Port Zod schemas to Rust structs with serde
   - Create error types
   - Set up basic parse function skeleton

### Phase 2: Core Parsing (Week 2)

1. **Header parsing**
   - Port gef-schemas.ts logic
   - Use serde for deserialization
   - Validate against spec

2. **CSV data parsing**
   - Record/column splitting
   - Number coercion
   - Void value handling
   - Test against real GEF files

3. **Extension detection**
   - Dutch/Belgian/standard logic
   - Measurement variable lookups

### Phase 3: Business Logic (Week 3)

1. **Depth correction**
   - Port depth-correction.ts
   - Inclination math
   - Pre-excavation handling
   - Cumulative depth calculation

2. **CPT-specific parsing**
   - Port parseGefCptData
   - Pre-excavation layers
   - Column quantity mapping

3. **Bore-specific parsing**
   - Port parseGefBoreData
   - Layer parsing
   - Specimen parsing
   - Soil code decoding

### Phase 4: Bindings (Week 4)

1. **WASM bindings**
   - wasm-bindgen exports
   - Test in browser/Node
   - Optimize binary size

2. **Python bindings**
   - PyO3 exports
   - Build wheel with maturin
   - Test in Python

3. **Host wrappers**
   - JavaScript wrapper (proj4 integration)
   - Python wrapper (pyproj integration)

### Phase 5: Testing & Migration (Week 5)

1. **Comprehensive testing**
   - Parse all test GEF files
   - Compare output with TypeScript version
   - Performance benchmarks

2. **Documentation**
   - API docs (rustdoc)
   - Migration guide for users
   - Examples

3. **Release**
   - Publish to npm (@bedrock-engineer/gef-parser v2.0)
   - Publish to PyPI (gef-parser)
   - Update repos

## Testing Strategy

### Validation Approach

Use existing TypeScript implementation as the specification:

1. **Parse same test files in both**
   - TypeScript (current)
   - Rust (new)

2. **Compare outputs** (JSON serialization)
   - Headers (all fields)
   - Data rows (all columns)
   - Warnings (same warnings generated)
   - Metadata (processed fields)

3. **Acceptance criteria**
   - 100% of test files parse successfully
   - Output matches TypeScript to float precision
   - All warnings generated (same messages)
   - Performance: >= 10x faster than TypeScript

### Test Files Needed

- Standard CPT files
- Dutch (BRO/VOTB) extension CPT
- Belgian (DOV) extension CPT
- Standard Bore files
- Files with various coordinate systems
- Files with pre-excavation layers
- Files with inclined drilling
- Edge cases (negative depths, void values, etc.)

## Performance Expectations

**Current (TypeScript + WASM tokenizer):**
- Small file (500 rows): ~50ms
- Large file (5000 rows): ~200ms

**Expected (Full Rust):**
- Small file (500 rows): ~5ms (10x faster)
- Large file (5000 rows): ~20ms (10x faster)

**Why faster:**
- No WASM→JS serialization overhead
- Single-pass parsing (no re-parsing)
- Efficient memory layout
- Compiled, not interpreted

## Bundle Size

**Current:**
- WASM: 53KB (tokenizer only)
- TypeScript: ~150KB compiled JS
- Total: ~200KB

**Expected:**
- WASM: ~100-150KB (full parser, optimized)
- TypeScript wrapper: ~5KB (just coord conversion)
- Total: ~110-160KB (smaller or similar)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Output doesn't match TypeScript | High | Extensive testing, gradual migration |
| WASM binary too large | Medium | Use wasm-opt, feature flags to strip debug |
| Python binding issues | Medium | Use proven maturin workflow, test early |
| Missing edge cases | Medium | Comprehensive test suite from production files |
| Spec table conversion errors | Low | Automated JSON schema validation |

## Success Metrics

- ✅ Single codebase for JS and Python
- ✅ 10x performance improvement
- ✅ 100% test coverage (all existing files parse)
- ✅ Output matches TypeScript implementation
- ✅ Clean architectural boundary (95% Rust, 5% host)
- ✅ Maintainable spec tables (JSON, not code)
- ✅ Published to npm and PyPI

## Next Steps

1. **Review and approve this plan**
2. **Set up Rust workspace**
3. **Start with spec table extraction to JSON**
4. **Implement core types and parser skeleton**
5. **Iterative development following migration phases**

## Questions to Resolve

- [ ] Should we keep TypeScript version as v1.x for compatibility?
- [ ] Python package name: `gef-parser` or `bedrock-gef-parser`?
- [ ] Minimum supported Python version? (3.8+, 3.9+?)
- [ ] Do we need a CLI tool? (easy to add with clap)
- [ ] License for Rust crates? (Apache-2.0 to match current?)
