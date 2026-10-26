// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { useRef, useState } from "react";
import { parseMatrixText } from "../../lib/hlc/telemetry";

export default function ScenarioPanel({ selected, onLoad, busy }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  function submitCustom() {
    const r = parseMatrixText(text);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    onLoad("custom", r.matrix);
  }

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) {
      setError("That file is larger than 2 MB. A 30×21 matrix should be a few kilobytes.");
      return;
    }
    const t = await f.text();
    setText(t);
    const r = parseMatrixText(t);
    if (!r.ok) {
      setError(r.error);
    } else {
      setError(null);
      onLoad("custom", r.matrix);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <div className="btn-row" role="group" aria-label="Preset scenarios">
        <button
          type="button"
          className={`btn ${selected === "nominal" ? "selected" : ""}`}
          aria-pressed={selected === "nominal"}
          disabled={busy}
          onClick={() => onLoad("nominal")}
        >
          ▶ Load Nominal Fleet Telemetry
        </button>
        <button
          type="button"
          className={`btn ${selected === "stress" ? "selected" : ""}`}
          aria-pressed={selected === "stress"}
          disabled={busy}
          onClick={() => onLoad("stress")}
        >
          ▶ Load Stress/Degrading Telemetry
        </button>
        <button
          type="button"
          className={`btn ${selected === "dropout" ? "selected" : ""}`}
          aria-pressed={selected === "dropout"}
          disabled={busy}
          onClick={() => onLoad("dropout")}
        >
          ▶ Simulate Sensor Dropout
        </button>
      </div>
      <p className="muted small-print">
        <strong>Sensor dropout:</strong> JSON cannot carry NaN (“not a number”), so 6 channels are knocked out
        another way: 3 are set to <strong>0.0</strong> for the whole window and 3 <strong>freeze at their last good
        value</strong> from step 10 onward. It is applied to the scenario you loaded last (Nominal if none).
      </p>

      <details>
        <summary>Use my own 30×21 JSON (paste or upload)</summary>
        <label htmlFor="custom-json" style={{ fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>
          Paste JSON: a list of 30 rows, each with 21 numbers — or {`{"sensor_stream": [...]}`}
        </label>
        <textarea
          id="custom-json"
          className="json"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-describedby={error ? "custom-err" : undefined}
          placeholder='[[0.5, 0.4, ... 21 numbers], ... 30 rows ]'
        />
        {error && (
          <div className="error-box" id="custom-err" role="alert">
            ✖ {error}
          </div>
        )}
        <div className="btn-row" style={{ marginTop: "0.75rem" }}>
          <button type="button" className="btn" onClick={submitCustom} disabled={busy || !text.trim()}>
            ▶ Use my JSON and run prediction
          </button>
          <label className="file-label">
            <input type="file" accept=".json,application/json" onChange={onFile} />
            <span className="btn secondary" role="button">
              📂 Upload a .json file
            </span>
          </label>
        </div>
      </details>
    </div>
  );
}
