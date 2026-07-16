#!/bin/bash
set -euo pipefail

# Update the WASM build of gef-file-to-map from upstream.
#
# Usage:
#   bash scripts/update-wasm.sh          # builds latest release
#   bash scripts/update-wasm.sh v1.0.1   # builds a specific tag
#
# Prerequisites: wasm-pack, cargo, git, curl, jq
#
# How the upstream integration works (kept deliberately patch-light so new
# upstream releases rarely break it):
#   1. remove-pyo3.patch strips the Python bindings from src/lib.rs and
#      src/error.rs. These blocks have been stable across upstream releases;
#      the patch contains no Cargo.toml hunks, which is the file that churns.
#   2. `cargo remove pyo3` + appended TOML tables handle Cargo.toml
#      programmatically, immune to upstream version bumps.
#   3. wasm-glue.rs (the wasm-bindgen wrapper) is copied in as its own module
#      instead of living inside a diff.
# If remove-pyo3.patch ever stops applying, regenerate it: delete the pyo3
# use-statements, the #[pyfunction]/#[pymodule] block in lib.rs, and the
# `impl From<Error> for PyErr` block in error.rs, then `git diff` the result.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WASM_OUT="$PROJECT_DIR/src/wasm"
REPO="cemsbv/gef-file-to-map"

# Resolve version: use argument, or fetch latest release tag
if [ -n "${1:-}" ]; then
  VERSION="$1"
else
  echo "Fetching latest release tag from $REPO..."
  VERSION=$(curl -sf "https://api.github.com/repos/$REPO/releases/latest" | jq -r '.tag_name')
  if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
    echo "Error: could not determine latest release." >&2
    exit 1
  fi
fi

echo "Building gef-file-to-map @ $VERSION"

# Clone into a temp directory (cleaned up on exit)
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "Cloning $REPO @ $VERSION..."
git clone --depth 1 --branch "$VERSION" "https://github.com/$REPO.git" "$TEMP_DIR"
cd "$TEMP_DIR"
UPSTREAM_COMMIT=$(git rev-parse --short HEAD)

echo "Removing Python bindings..."
git apply "$SCRIPT_DIR/remove-pyo3.patch"
cargo remove --quiet pyo3

echo "Adding WASM glue..."
cp "$SCRIPT_DIR/wasm-glue.rs" src/wasm_glue.rs
printf '\npub mod wasm_glue;\n' >> src/lib.rs
cat >> Cargo.toml <<'EOF'

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies.wasm-bindgen]
version = "0.2"

[dependencies.serde]
version = "1.0"
features = ["derive"]

[dependencies.serde-wasm-bindgen]
version = "0.6"

[dependencies.console_error_panic_hook]
version = "0.1"
EOF

# Run upstream's own test suite (includes header-parsing regression tests,
# e.g. empty header values) against the patched source before vendoring.
echo "Running upstream tests..."
cargo test --quiet

echo "Building WASM (this may take a minute)..."
wasm-pack build --target web --out-dir pkg

echo "Copying output to $WASM_OUT..."
mkdir -p "$WASM_OUT"
cp pkg/gef_file_to_map_bg.wasm "$WASM_OUT/"
cp pkg/gef_file_to_map.js "$WASM_OUT/"
cp pkg/gef_file_to_map.d.ts "$WASM_OUT/"
cp pkg/gef_file_to_map_bg.wasm.d.ts "$WASM_OUT/"

# Record provenance so "which version are we on?" is answerable from disk
cat > "$WASM_OUT/VERSION" <<EOF
gef-file-to-map $VERSION (commit $UPSTREAM_COMMIT)
built $(date +%Y-%m-%d) with wasm-pack $(wasm-pack --version | awk '{print $2}')
EOF

echo ""
echo "Done! Updated src/wasm/ from gef-file-to-map $VERSION ($UPSTREAM_COMMIT)"

echo "Running npm test..."
cd "$PROJECT_DIR"
npm test
