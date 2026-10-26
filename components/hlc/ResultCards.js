// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { classifyRul, classifyStatus, OJAS_MAX, OJAS_MIN, ojasPosition } from "../../lib/hlc/status";

export default function ResultCards({ p, onRetry }) {
  return (
    <section aria-labelledby="out-h" aria-live="polite">
      <h2 id="out-h">Prediction</h2>

      {p.state === "error" && (
        <div className="error-box" role="alert">
          <p style={{ margin: 0 }}>✖ Could not get a prediction: {p.message}</p>
          <p className="muted" style={{ marginBottom: 0 }}>
            Make sure the engine is ONLINE (see the connection box above), then try again.
          </p>
          <div className="btn-row" style={{ marginTop: "0.75rem" }}>
            <button type="button" className="btn" onClick={onRetry}>
              ↻ Run prediction again
            </button>
          </div>
        </div>
      )}

      <div className="results">
        <RulCard p={p} />
        <OjasCard p={p} />
        <StatusCard p={p} />
      </div>
    </section>
  );
}

function Waiting({ p }) {
  return (
    <p className="placeholder">
      {p.state === "loading" ? "⏳ Asking the engine…" : p.state === "error" ? "No result." : "Load a scenario to see a result."}
    </p>
  );
}

function RulCard({ p }) {
  const done = p.state === "done";
  const rul = done ? classifyRul(p.data.predicted_remaining_life_cycles) : null;
  return (
    <article className="card result-card" aria-labelledby="rul-h">
      <h3 id="rul-h">Remaining useful life (RUL)</h3>
      {done && rul ? (
        <>
          <div className={`big-num tone-${rul.tone}`}>
            {p.data.predicted_remaining_life_cycles.toFixed(2)}
            <span className="unit"> cycles</span>
          </div>
          <div>
            <span className={`badge ${rul.tone}`}>
              <span aria-hidden="true">{rul.icon}</span> {rul.band}
            </span>
          </div>
          <p style={{ margin: 0 }}>{rul.description}</p>
          <p className="muted small-print" style={{ margin: 0 }}>
            Bands: above 50 = HEALTHY · 25 to 50 = WATCH · below 25 = ACT NOW
          </p>
        </>
      ) : (
        <Waiting p={p} />
      )}
    </article>
  );
}

function OjasCard({ p }) {
  const done = p.state === "done";
  const pos = done ? ojasPosition(p.data.ojas_vitality_index) : null;
  return (
    <article className="card result-card" aria-labelledby="ojas-h">
      <h3 id="ojas-h">Ojas vitality index</h3>
      <p className="muted" style={{ margin: 0 }}>
        internal systemic load
      </p>
      {done && pos ? (
        <>
          <div className="big-num">{p.data.ojas_vitality_index.toFixed(2)}</div>
          <div
            className="gauge-track"
            role="meter"
            aria-valuemin={OJAS_MIN}
            aria-valuemax={OJAS_MAX}
            aria-valuenow={Math.min(OJAS_MAX, Math.max(OJAS_MIN, p.data.ojas_vitality_index))}
            aria-label="Ojas vitality index on a scale from 1.0 to 8.0"
          >
            <div className="gauge-fill" style={{ width: `${Math.max(pos.percent, 1.5)}%` }} />
          </div>
          <div className="gauge-ticks" aria-hidden="true">
            <span>{OJAS_MIN.toFixed(1)}</span>
            <span>scale</span>
            <span>{OJAS_MAX.toFixed(1)}</span>
          </div>
          <p style={{ margin: 0 }}>
            <strong>{p.data.ojas_vitality_index.toFixed(2)}</strong> on a scale of 1.0 to 8.0 ({Math.round(pos.percent)}% along the bar)
          </p>
          {pos.outOfRange && (
            <p className="tone-warn" style={{ margin: 0, fontWeight: 800 }}>
              ⚠ Value is outside the expected 1.0–8.0 range; the bar is capped.
            </p>
          )}
        </>
      ) : (
        <Waiting p={p} />
      )}
      <p className="muted carry-note" data-testid="ojas-carry-note" style={{ margin: 0 }}>
        <strong>Ojas carries over between requests.</strong> It is the engine’s running stress memory, so the same input
        can give a different RUL and Ojas on a repeat call. Restarting the engine resets it to 1.0.
      </p>
    </article>
  );
}

function StatusCard({ p }) {
  const done = p.state === "done";
  const st = done ? classifyStatus(p.data.status) : null;
  return (
    <article className="card result-card" aria-labelledby="stat-h">
      <h3 id="stat-h">Operational status</h3>
      {done && st ? (
        <>
          <div className={`status-icon tone-${st.tone}`} aria-hidden="true">
            {st.icon}
          </div>
          <div className={`status-word tone-${st.tone}`}>{st.status}</div>
          <div>
            <span className={`badge ${st.tone}`}>
              <span aria-hidden="true">{st.icon}</span> {st.status}
            </span>
          </div>
          {st.status === "UNKNOWN" && (
            <p style={{ margin: 0 }}>The engine returned an unexpected status: “{p.data.status}”.</p>
          )}
        </>
      ) : (
        <Waiting p={p} />
      )}
    </article>
  );
}
