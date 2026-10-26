// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
/**
 * The engine download is a plain STATIC file in public/downloads/ (no API route, works on Vercel).
 * Size and SHA-256 are fixed here; if you replace the zip, update both (run `sha256sum` and `stat -c %s` on it).
 */
export const BUNDLE = {
  fileName: "hlc_edge_engine_v2_nasa.zip",
  url: "/downloads/hlc_edge_engine_v2_nasa.zip",
  sizeBytes: 805871,
  sizeHuman: "787 KB (805,871 bytes)",
  sha256: "9ce365320a9b3ca8f973064d06c12e93ab5847b7db8c1150078ea5c395614839",
  title: "v2.0.1 — Evaluation & Benchmarking Build, retrained on real NASA FD001",
};
