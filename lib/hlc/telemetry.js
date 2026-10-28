// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
/**
 * Preset telemetry + helpers.
 *
 * Preset matrices live in lib/hlc/presets.json. They are REAL slices of NASA C-MAPSS FD001 (engine unit 1,
 * first / last 30 cycles), already min-max normalised to ~0..1, because the engine's /predict does NOT normalise
 * anything. "nasa_v3" uses the v3 engine's norm_stats.json (min/max of all 100 training engines, six constant
 * sensors = 0); "nasa_v2" uses the v2 engine's norm_stats.json (80 train engines); "nasa" is the older whole-file
 * scaling used by the v1 engine.
 */
import presetData from "./presets.json";

export const TIMESTEPS = 30;
export const CHANNELS = 21;

export const PRESET_SETS = presetData;
/** v3 is the default download, so the v3 scaling is the default; the page switches to the v2 or v1 scaling by itself if an older engine answers. */
export const DEFAULT_DATASET = "nasa_v3";
export const V1_DATASET = "nasa";
export const V2_DATASET = "nasa_v2";
export const V3_DATASET = "nasa_v3";

/** Pick the preset scaling that matches the connected engine, from its /health answer. */
export function datasetForHealth(h) {
  if (h && h.weights === "nasa_v2") return V2_DATASET;
  if (h && /\bv3\b/i.test(h.engine || "")) return V3_DATASET;
  return V1_DATASET;
}

export function presetMatrix(dataset, kind) {
  return PRESET_SETS[dataset][kind].map((r) => r.slice());
}

/**
 * Channels (0-based) that the dropout simulation knocks out.
 * JSON cannot carry NaN, so a "dead" sensor is represented in one of two ways:
 *  - zeroed : the channel reads 0.0 for the whole window
 *  - stuck  : the channel freezes at its last good value (from timestep 10 on)
 */
export const DROPOUT_PLAN = [
  { channel: 1, kind: "zeroed" },
  { channel: 6, kind: "stuck" },
  { channel: 10, kind: "zeroed" },
  { channel: 11, kind: "stuck" },
  { channel: 16, kind: "stuck" },
  { channel: 19, kind: "zeroed" },
];

const STUCK_FROM = 10;

/** Return a copy of `base` with the DROPOUT_PLAN channels knocked out. */
export function applyDropout(base) {
  const out = base.map((r) => r.slice());
  for (const d of DROPOUT_PLAN) {
    for (let t = 0; t < out.length; t++) {
      if (d.kind === "zeroed") out[t][d.channel] = 0;
      else if (t >= STUCK_FROM) out[t][d.channel] = out[STUCK_FROM - 1][d.channel];
    }
  }
  return out;
}

/**
 * Validate a user-provided matrix. Accepts either a bare 30x21 array or an
 * object {"sensor_stream": [[...]]}. Every value must be a finite number.
 */
export function validateMatrix(input) {
  let data = input;
  if (data && typeof data === "object" && !Array.isArray(data) && "sensor_stream" in data) {
    data = data.sensor_stream;
  }
  if (!Array.isArray(data)) {
    return { ok: false, error: "Expected a list of 30 rows (or an object with a \"sensor_stream\" list)." };
  }
  if (data.length !== TIMESTEPS) {
    return { ok: false, error: `Expected exactly ${TIMESTEPS} rows (timesteps) but found ${data.length}.` };
  }
  for (let t = 0; t < data.length; t++) {
    const row = data[t];
    if (!Array.isArray(row)) return { ok: false, error: `Row ${t + 1} is not a list of numbers.` };
    if (row.length !== CHANNELS) {
      return { ok: false, error: `Row ${t + 1} has ${row.length} numbers; expected exactly ${CHANNELS}.` };
    }
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        return { ok: false, error: `Row ${t + 1}, column ${c + 1} is not a finite number.` };
      }
    }
  }
  return { ok: true, matrix: data };
}

/** Parse JSON text then validate; returns friendly errors. */
export function parseMatrixText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `That is not valid JSON (${detail}). Note: NaN, Infinity and empty values are not allowed in JSON.`,
    };
  }
  return validateMatrix(parsed);
}

/** Per-channel min and max (for the preview). */
export function channelStats(m) {
  const stats = [];
  for (let c = 0; c < CHANNELS; c++) {
    let min = Infinity;
    let max = -Infinity;
    for (let t = 0; t < m.length; t++) {
      const v = m[t][c];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    stats.push({ min, max });
  }
  return stats;
}
