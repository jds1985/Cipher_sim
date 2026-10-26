// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { PRESET_SETS } from "../../lib/hlc/telemetry";

/**
 * Chooses which preset data the three buttons use. All are already min-max normalised to ~0..1,
 * which is what the engine's /predict expects (it does not normalise by itself). The v2 engine needs the
 * "v2 scaling" (its norm_stats.json); the older v1 / v1.1 engine was fitted with the whole-file scaling.
 */
export default function DatasetPicker({ value, onChange, engineWeights }) {
  const ids = ["nasa_v2", "nasa", "clone"];
  const sel = PRESET_SETS[value];
  const mismatch =
    engineWeights !== null && (engineWeights === "nasa_v2" ? sel.forEngine !== "v2" : sel.forEngine === "v2");
  return (
    <fieldset className="dataset-picker">
      <legend>Which data do the buttons use?</legend>
      {ids.map((id) => {
        const s = PRESET_SETS[id];
        return (
          <label key={id} className={`radio ${value === id ? "on" : ""}`}>
            <input type="radio" name="dataset" value={id} checked={value === id} onChange={() => onChange(id)} />
            <span>
              <strong>{s.synthetic ? "⚠ SYNTHETIC — " : "✔ REAL — "}</strong>
              {s.label}
              {s.forEngine === "v1" ? " — for the v1 / v1.1 engine" : ""}
            </span>
          </label>
        );
      })}
      <p className="muted small-print" style={{ marginBottom: 0 }}>
        {value === "nasa_v2" ? (
          <>
            Real turbofan telemetry from the public NASA C-MAPSS FD001 file (engine unit 1: its first 30 cycles are
            “nominal”, its last 30 cycles before failure are “degrading”), scaled with the <strong>v2 engine’s</strong>{" "}
            <code>norm_stats.json</code> (min/max of its 80 training engines). Use this with the v2 engine; unit 1 was
            one of its training engines, so this is a demonstration, not a test.
          </>
        ) : value === "nasa" ? (
          <>
            Real turbofan telemetry from the public NASA C-MAPSS FD001 file (engine unit 1), scaled to 0–1 over the whole
            file the way the <strong>v1 / v1.1</strong> test script does it. <strong>Heads-up:</strong> the v1 / v1.1
            weights were fitted to the synthetic clone, and on real NASA data they do not separate healthy from failing
            engines — see “About &amp; accuracy”. The v2 engine needs the “v2 scaling” option instead.
          </>
        ) : (
          <>
            A computer-generated “engine clone” (numpy seed 42) from the v1 training script — the data the{" "}
            <strong>v1 / v1.1</strong> weights were fitted to. It is <strong>not</strong> NASA data and not from a real
            machine.
          </>
        )}
      </p>
      {mismatch && (
        <p className="demo-banner" role="alert" data-testid="scaling-mismatch" style={{ marginTop: "0.6rem" }}>
          ⚠ Mismatch: the connected engine is{" "}
          {engineWeights === "nasa_v2" ? "the v2 engine but this data uses the v1 scaling" : "a v1 / v1.1 engine but this data uses the v2 scaling"}
          . Pick the matching option or the answers will be off.
        </p>
      )}
    </fieldset>
  );
}
