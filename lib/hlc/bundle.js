// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
/**
 * The engine download is a plain STATIC file in public/downloads/ (no API route, works on Vercel).
 * Size and SHA-256 are fixed here; if you replace the zip, update both (run `sha256sum` and `stat -c %s` on it).
 * tests/bundle.test.mjs fails if this file and the zip in public/downloads disagree.
 */
export const BUNDLE = {
  fileName: "hlc_edge_engine_v3_nasa.zip",
  url: "/downloads/hlc_edge_engine_v3_nasa.zip",
  sizeBytes: 228990,
  sizeHuman: "229 KB (228,990 bytes)",
  sha256: "b2a7ccdaef90fc8a478c7e7bee1194420fdf9534879f96ec6f6a7004f4409a16",
  title: "v3.0 — Evaluation & Benchmarking Build, trained on all 100 NASA FD001 training engines",
};
