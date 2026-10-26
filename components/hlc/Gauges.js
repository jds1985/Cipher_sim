// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { classifyStatus, dialPercent, ojasPercent, OJAS_BASELINE, OJAS_DISPLAY_MAX, RUL_DIAL_MAX } from "../../lib/hlc/status";

const R = 100;
const C = 120;

function tickAt(cycles) {
  const a = (cycles / RUL_DIAL_MAX) * 2 * Math.PI - Math.PI / 2;
  const [r1, r2] = [R - 12, R + 12];
  return { x1: C + r1 * Math.cos(a), y1: C + r1 * Math.sin(a), x2: C + r2 * Math.cos(a), y2: C + r2 * Math.sin(a) };
}

/** Circular RUL dial + health badge. `p` is the prediction state. */
export function RulDial({ p }) {
  const done = p.state === "done";
  const rul = done ? p.data.predicted_remaining_life_cycles : null;
  const st = done ? classifyStatus(p.data.status) : null;
  const tone = st ? st.tone : "idle";
  const pct = done ? dialPercent(rul) : 0;
  const valueText = done
    ? `${rul.toFixed(2)} cycles of remaining useful life. Status ${st.status}.`
    : p.state === "loading"
      ? "Waiting for the engine"
      : "No result yet";
  return (
    <div className="hx-gauge-card">
      <h3 className="hx-gauge-label" id="hx-rul-h">
        Remaining Useful Life
      </h3>
      <div
        className="hx-dial"
        data-tone={tone}
        data-testid="rul-dial"
        role="meter"
        aria-labelledby="hx-rul-h"
        aria-valuemin={0}
        aria-valuemax={RUL_DIAL_MAX}
        aria-valuenow={done ? Math.min(RUL_DIAL_MAX, Math.max(0, rul)) : 0}
        aria-valuetext={valueText}
      >
        <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false">
          <circle className="hx-dial-track" cx={C} cy={C} r={R} />
          {done && (
            <circle
              className="hx-dial-arc"
              cx={C}
              cy={C}
              r={R}
              pathLength="100"
              strokeDasharray={`${pct} 100`}
              transform={`rotate(-90 ${C} ${C})`}
            />
          )}
          {[25, 50].map((t) => {
            const k = tickAt(t);
            return <line key={t} className="hx-dial-tick" {...k} />;
          })}
        </svg>
        <div className="hx-dial-center" aria-hidden="true">
          <span className="hx-dial-num" data-testid="rul-value">
            {done ? rul.toFixed(2) : p.state === "loading" ? "…" : "—"}
          </span>
          <span className="hx-dial-unit">cycles remaining</span>
        </div>
      </div>
      <div className="hx-badge" data-tone={tone} data-testid="health-badge">
        <span aria-hidden="true">{done ? st.icon : "○"}</span>
        <span>{done ? st.status : p.state === "loading" ? "RUNNING" : "AWAITING RUN"}</span>
      </div>
      <p className="hx-legend">Marks on the dial: 25 and 50 cycles. Under 25 means act now.</p>
    </div>
  );
}

/** Horizontal thermal-gradient meter for Systemic Friction (Ojas Ledger). */
export function OjasMeter({ p }) {
  const done = p.state === "done";
  const v = done ? p.data.ojas_vitality_index : null;
  const pct = done ? ojasPercent(v) : 0;
  const delta = done ? v - OJAS_BASELINE : null;
  const text = done ? `${v.toFixed(2)}, which is ${delta.toFixed(2)} above the 1.0 baseline` : "No result yet";
  return (
    <div>
      <h3 className="hx-gauge-label" id="hx-ojas-h">
        Systemic Friction (Ojas Ledger)
      </h3>
      <div className="hx-ojas-val">
        <span className="hx-ojas-num" data-testid="ojas-value">
          {done ? v.toFixed(2) : "—"}
        </span>
        <span className="hx-ojas-delta">{done ? `+${delta.toFixed(2)} above baseline` : "baseline is 1.0"}</span>
      </div>
      <div
        className="hx-ojas-track"
        data-testid="ojas-meter"
        role="meter"
        aria-labelledby="hx-ojas-h"
        aria-valuemin={OJAS_BASELINE}
        aria-valuemax={OJAS_DISPLAY_MAX}
        aria-valuenow={done ? Math.min(OJAS_DISPLAY_MAX, Math.max(OJAS_BASELINE, v)) : OJAS_BASELINE}
        aria-valuetext={text}
        data-percent={pct.toFixed(1)}
      >
        <div className="hx-ojas-rest" style={{ left: `${pct}%` }} aria-hidden="true" />
        {done && <div className="hx-ojas-needle" style={{ left: `${pct}%` }} aria-hidden="true" />}
      </div>
      <div className="hx-ojas-ends" aria-hidden="true">
        <span>◀ 1.0 Baseline</span>
        <span>{OJAS_DISPLAY_MAX.toFixed(1)}+ Fault stress ▶</span>
      </div>
    </div>
  );
}

/** Edge latency pill. Shows the REAL measured browser round trip, or "— ms" before the first run / when offline. */
export function LatencyPill({ latencyMs }) {
  const has = typeof latencyMs === "number" && Number.isFinite(latencyMs);
  const ms = has ? `${latencyMs.toFixed(1)} ms` : "— ms";
  return (
    <div>
      <div
        className="hx-pill"
        data-testid="latency-pill"
        role="group"
        aria-label={`${has ? `Measured round trip ${latencyMs.toFixed(1)} milliseconds` : "No measurement yet"}. Local CPU silicon. Zero cloud dependency.`}
      >
        <span className="hx-pill-ms" data-testid="latency-ms">
          {ms}
        </span>
        <span className="hx-pill-sep" aria-hidden="true">
          |
        </span>
        <span>Local CPU Silicon</span>
        <span className="hx-pill-sep" aria-hidden="true">
          |
        </span>
        <span>Zero Cloud Dependency</span>
      </div>
      <p className="hx-pill-hint">
        {has ? "Measured just now, from this page to the engine on your computer." : "Run a simulation to measure it live on your machine."}
      </p>
    </div>
  );
}
