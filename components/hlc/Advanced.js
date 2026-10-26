// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
import { useRef, useState } from "react";
import { parseMatrixText } from "../../lib/hlc/telemetry";

/** Power-user tools, collapsed by default: sensor-dropout test and your own 30×21 JSON. */
export default function Advanced({ busy, onDropout, onCustom }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  function submit(t) {
    const r = parseMatrixText(t);
    if (!r.ok) return setError(r.error);
    setError(null);
    onCustom(r.matrix);
  }
  async function onFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 2_000_000) return setError("That file is larger than 2 MB. A 30×21 matrix should be a few kilobytes.");
    const t = await f.text();
    setText(t);
    submit(t);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <details className="hx-adv" data-testid="advanced">
      <summary>Advanced</summary>
      <div className="hx-adv-body">
        <div>
          <button type="button" className="hx-btn hx-btn-ghost" disabled={busy} onClick={onDropout} data-testid="run-dropout">
            Run sensor-dropout test
          </button>
          <p className="hx-gauge-hint" style={{ marginTop: 8 }}>
            Knocks out 6 of the 21 sensor channels (3 read zero, 3 freeze) in the last scenario you ran.
          </p>
        </div>
        <div>
          <label htmlFor="hx-json">Your own telemetry: 30 rows of 21 numbers, as JSON</label>
          <textarea id="hx-json" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder="[[0.5, 0.4, … 21 numbers], … 30 rows]" />
        </div>
        {error && (
          <div className="hx-err" role="alert">
            ✖ {error}
          </div>
        )}
        <div className="hx-adv-row">
          <button type="button" className="hx-btn hx-btn-ghost" disabled={busy || !text.trim()} onClick={() => submit(text)}>
            Run my JSON
          </button>
          <label className="hx-btn hx-btn-ghost" style={{ marginBottom: 0 }}>
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
            Upload a .json file
          </label>
        </div>
      </div>
    </details>
  );
}
