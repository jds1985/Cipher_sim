// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { useState } from "react";
import { LatencyPill, OjasMeter, RulDial } from "./Gauges";
import { classifyStatus } from "../../lib/hlc/status";

const ACTIONS = [
  { kind: "nominal", glyph: "▶", title: "Simulate Nominal Fleet Run", desc: "Healthy engine telemetry through the real engine" },
  { kind: "stress", glyph: "▲", title: "Simulate Thermal / Stress Fatigue", desc: "Degrading engine telemetry, close to failure" },
];

function EngineChip({ health }) {
  if (health.state === "online") {
    const demo = health.data.device === "demo-standin";
    return (
      <span className="hx-chip" data-tone={demo ? "idle" : "ok"} data-testid="engine-chip">
        <span aria-hidden="true">{demo ? "◆" : "✔"}</span> {demo ? "ONLINE · DEMO STAND-IN" : "ENGINE ONLINE"}
      </span>
    );
  }
  if (health.state === "offline") {
    return (
      <span className="hx-chip" data-tone="bad" data-testid="engine-chip">
        <span aria-hidden="true">✖</span> ENGINE OFFLINE
      </span>
    );
  }
  return (
    <span className="hx-chip" data-tone="idle" data-testid="engine-chip">
      <span aria-hidden="true">…</span> CHECKING
    </span>
  );
}

export default function Console({ health, pred, latencyMs, selected, onRun, onRecheck, onRetry }) {
  const [copied, setCopied] = useState(false);
  const busy = pred.state === "loading";

  async function copyCmd() {
    try {
      await navigator.clipboard.writeText("bash run_engine.sh");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  let live;
  if (pred.state === "done") {
    const st = classifyStatus(pred.data.status);
    live = (
      <>
        <strong>
          {st.icon} {st.status}
        </strong>{" "}
        · {pred.data.predicted_remaining_life_cycles.toFixed(2)} cycles remaining · Ojas {pred.data.ojas_vitality_index.toFixed(2)}
      </>
    );
  } else if (pred.state === "loading") {
    live = "Asking the engine on your computer…";
  } else if (pred.state === "error") {
    live = null;
  } else {
    live = "Choose a simulation above. It runs the real engine on your own computer.";
  }

  return (
    <section className="hx-panel" id="demo" aria-labelledby="hx-console-h" tabIndex={-1}>
      <div className="hx-panel-head">
        <h2 className="hx-h2" id="hx-console-h">
          Live Engine Console
        </h2>
        <div className="hx-chip-row">
          <div role="status" aria-live="polite" aria-atomic="true">
            <EngineChip health={health} />
          </div>
          <button type="button" className="hx-link-btn" onClick={onRecheck} data-testid="recheck">
            ↻ Check again
          </button>
        </div>
      </div>
      <p className="hx-sub">Run a simulated fleet scenario through the HLC engine on your own machine. Nothing is sent to any cloud.</p>

      <div className="hx-actions" role="group" aria-label="Simulation scenarios">
        {ACTIONS.map((a) => (
          <button
            key={a.kind}
            type="button"
            className="hx-action"
            data-kind={a.kind}
            data-testid={`run-${a.kind}`}
            aria-pressed={selected === a.kind}
            disabled={busy}
            onClick={() => onRun(a.kind)}
          >
            <span className="hx-action-title">
              <span className="hx-action-glyph" aria-hidden="true">
                {a.glyph}
              </span>
              {a.title}
            </span>
            <span className="hx-action-desc">{a.desc}</span>
            {selected === a.kind && <span className="hx-action-sel">✔ Selected</span>}
          </button>
        ))}
      </div>

      {health.state === "offline" && (
        <div className="hx-note" data-testid="offline-help">
          <p>
            <strong>Engine not detected.</strong> Download it below, unzip it, and run <code>bash run_engine.sh</code>. This page connects by itself.
          </p>
          <div className="hx-note-row">
            <button type="button" className="hx-copy" onClick={copyCmd}>
              {copied ? "✔ Copied" : "Copy command"}
            </button>
            <a href="#download">Go to download</a>
          </div>
          <p>
            Your browser may ask to let this site reach apps on your computer. Choose <strong>Allow</strong>. Everything stays on your machine.
          </p>
        </div>
      )}
      {health.state === "online" && health.data.device === "demo-standin" && (
        <div className="hx-note">
          <p>
            <strong>Demo stand-in:</strong> this is not the trained engine, so the numbers are placeholders.
          </p>
        </div>
      )}
      {pred.state === "error" && (
        <div className="hx-note" data-tone="bad" role="alert" data-testid="predict-error">
          <p>
            <strong>✖ Could not get a result.</strong> {pred.message}
          </p>
          <div className="hx-note-row">
            <button type="button" className="hx-copy" onClick={onRetry}>
              ↻ Try again
            </button>
          </div>
        </div>
      )}

      <div className="hx-gauges" aria-busy={busy}>
        <RulDial p={pred} />
        <div className="hx-side">
          <OjasMeter p={pred} />
        </div>
      </div>

      <div className="hx-latrow">
        <LatencyPill latencyMs={latencyMs} />
      </div>

      <p className="hx-live" role="status" aria-live="polite" data-testid="live-summary">
        {live}
      </p>
    </section>
  );
}
