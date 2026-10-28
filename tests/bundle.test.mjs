// © 2026 Cipher CTS. All Rights Reserved.
// The /hlc download: bundle.js must describe the real zip in public/downloads, and the page copy must carry the v3 numbers only.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { BUNDLE } from "../lib/hlc/bundle.js";

const file = new URL(`../public/downloads/${BUNDLE.fileName}`, import.meta.url);
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("bundle.js size and SHA-256 match the zip in public/downloads", () => {
  assert.equal(BUNDLE.url, `/downloads/${BUNDLE.fileName}`);
  assert.equal(statSync(file).size, BUNDLE.sizeBytes);
  assert.equal(createHash("sha256").update(readFileSync(file)).digest("hex"), BUNDLE.sha256);
  assert.match(BUNDLE.fileName, /^hlc_edge_engine_v3_nasa\.zip$/);
});

test("/hlc page copy: v3 numbers present, stale v2 numbers absent", () => {
  const copy = ["components/hlc/Metrics.js", "components/hlc/ReleaseCard.js", "lib/hlc/bundle.js", "pages/hlc.js"].map(read).join("\n");
  for (const must of ["13.6", "~229", "7 of 7", "0.8 ms", "228,990"]) assert.ok(copy.includes(must), `missing ${must}`);
  for (const stale of ["15.29", "15.3", "805,871", "14.2 ms", "9.02", "~787", "hlc_edge_engine_v2", "Apache", "THIRD_PARTY_NOTICES", "Pearson"]) {
    assert.ok(!copy.includes(stale), `stale text still present: ${stale}`);
  }
});

test("public/downloads holds only the current HLC zip (no old versions left to link to)", () => {
  const files = readdirSync(new URL("../public/downloads/", import.meta.url));
  assert.deepEqual(files, [BUNDLE.fileName]);
});

test("license texts point at the NOTICE file the free zip ships, not THIRD_PARTY_NOTICES", () => {
  for (const f of ["content/hlc/HLC_EVALUATION_LICENSE.txt", "content/hlc/HLC_COMMERCIAL_TERMS.txt"]) {
    assert.ok(!read(f).includes("THIRD_PARTY_NOTICES"), `${f} still names THIRD_PARTY_NOTICES`);
  }
});
