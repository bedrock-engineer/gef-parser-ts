//! WASM bindings around [`crate::parse`].
//!
//! This module is NOT part of upstream gef-file-to-map. It is injected into
//! the upstream source by gef-parser-js's scripts/update-wasm.sh, which copies
//! it to src/wasm_glue.rs and appends `pub mod wasm_glue;` to src/lib.rs.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use crate::HeaderMap;

/// Serializable version of HeaderMap for WASM.
#[derive(Serialize, Deserialize)]
pub struct SerializableHeaderMap {
    pub headers: HashMap<String, Vec<Vec<String>>>,
}

impl<'a> From<HeaderMap<'a>> for SerializableHeaderMap {
    fn from(header_map: HeaderMap<'a>) -> Self {
        let headers = header_map
            .into_iter()
            .map(|(k, v)| {
                (
                    k.to_string(),
                    v.into_iter()
                        .map(|values| values.into_iter().map(str::to_string).collect())
                        .collect(),
                )
            })
            .collect();

        SerializableHeaderMap { headers }
    }
}

/// Result structure for WASM.
#[derive(Serialize, Deserialize)]
pub struct GefParseResult {
    pub data: String,
    pub headers: SerializableHeaderMap,
}

/// WASM wrapper around the parse function.
#[wasm_bindgen]
pub fn parse_gef_wasm(gef: &str) -> Result<JsValue, JsValue> {
    console_error_panic_hook::set_once();

    let (data, headers) =
        crate::parse(gef).map_err(|e| JsValue::from_str(&format!("Parse error: {e}")))?;

    let result = GefParseResult {
        data: data.to_string(),
        headers: headers.into(),
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {e}")))
}

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}
