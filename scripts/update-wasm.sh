#!/bin/bash
set -euo pipefail

# Update the WASM build of gef-file-to-map from upstream.
#
# Usage:
#   bash scripts/update-wasm.sh          # builds latest release
#   bash scripts/update-wasm.sh v1.0.1   # builds a specific tag
#
# Prerequisites: wasm-pack, git, curl, jq

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WASM_OUT="$PROJECT_DIR/src/wasm"
REPO="cemsbv/gef-file-to-map"
PATCH_FILE="$SCRIPT_DIR/wasm.patch"

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

# Apply the patch that swaps pyo3 for wasm-bindgen
echo "Applying WASM patch..."
cd "$TEMP_DIR"
git apply "$PATCH_FILE"

# Build with wasm-pack
echo "Building WASM (this may take a minute)..."
wasm-pack build --target web --out-dir pkg

# Copy artifacts
echo "Copying output to $WASM_OUT..."
mkdir -p "$WASM_OUT"
cp pkg/gef_file_to_map_bg.wasm "$WASM_OUT/"
cp pkg/gef_file_to_map.js "$WASM_OUT/"
cp pkg/gef_file_to_map.d.ts "$WASM_OUT/"
cp pkg/gef_file_to_map_bg.wasm.d.ts "$WASM_OUT/"

echo ""
echo "Done! Updated src/wasm/ from gef-file-to-map $VERSION"
echo "Don't forget to test: npm test"
