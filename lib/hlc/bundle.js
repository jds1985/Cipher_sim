// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
/**
 * The engine download is a plain STATIC file in public/downloads/ (no API route, works on Vercel).
 * Size and SHA-256 are fixed here; if you replace the zip, update both (run `sha256sum` and `stat -c %s` on it).
 */
export const BUNDLE = {
  fileName: "hlc_edge_engine_v2_nasa.zip",
  url: "/downloads/hlc_edge_engine_v2_nasa.zip",
  sizeBytes: 805331,
  sizeHuman: "0.8 MB (805,331 bytes)",
  sha256: "65b7d394eceadfcfef5df45009cbf6d209dc1611870c4871630703d83441de24",
  title: "v2 — retrained on real NASA FD001 (+ CORS patch, norm_stats.json)",
};
