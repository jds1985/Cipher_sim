// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { useState } from "react";
import { ENGINE_URL } from "../../lib/hlc/engine";

function fmtTime(d) {
  return d ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "not yet";
}

export default function ConnectionBar({ health, onRecheck }) {
  const [copied, setCopied] = useState(false);

  async function copyCmd() {
    try {
      await navigator.clipboard.writeText("bash run_engine.sh");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const online = health.state === "online";
  const isDemo = online && health.data.device === "demo-standin";

  return (
    <section className="card conn" aria-labelledby="conn-h">
      <div className="conn-top">
        <div>
          <h2 id="conn-h" style={{ marginBottom: 0 }}>
            Engine connection
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Looking for the engine at <code>{ENGINE_URL}</code> on this computer
          </p>
        </div>
        <div role="status" aria-live="polite" aria-atomic="true">
          {health.state === "checking" && <span className="badge checking">⏳ CHECKING…</span>}
          {health.state === "online" && <span className="badge ok">✔ ONLINE</span>}
          {health.state === "offline" && <span className="badge bad">✖ OFFLINE</span>}
        </div>
        <button type="button" className="btn secondary" onClick={onRecheck}>
          ↻ Check again
        </button>
      </div>

      <p className="muted" style={{ margin: 0 }}>
        Last checked: <strong>{fmtTime(health.lastChecked)}</strong> · re-checks automatically every 10 seconds
      </p>

      {online && (
        <dl className="conn-facts">
          <div>
            <dt>Engine</dt>
            <dd>{health.data.engine}</dd>
          </div>
          <div>
            <dt>Architecture</dt>
            <dd>{health.data.architecture}</dd>
          </div>
          <div>
            <dt>Device</dt>
            <dd>{health.data.device}</dd>
          </div>
          <div>
            <dt>Weights</dt>
            <dd data-testid="weights">
              {health.data.weights === "nasa_v2" ? "v2 — trained on real NASA FD001" : "v1 / v1.1 (original)"}
            </dd>
          </div>
        </dl>
      )}

      {isDemo && (
        <div className="demo-banner" role="alert">
          ⚠ DEMO STAND-IN, NOT THE REAL ENGINE. The numbers below come from a fake test server (device “demo-standin”).
        </div>
      )}

      {health.state === "offline" && (
        <div className="offline-help" role="region" aria-label="How to start the engine">
          <h2>The engine is not reachable (yet)</h2>
          <p>
            That is OK — this page only talks to an engine running <strong>on your own computer</strong>. To start it:
          </p>
          <ol>
            <li>
              Open a terminal in the folder where you unzipped the engine bundle (or where your engine files are).
            </li>
            <li>
              <div className="cmd">
                Type: <code>bash run_engine.sh</code>
                <button type="button" className="btn secondary" onClick={copyCmd}>
                  {copied ? "✔ Copied" : "Copy command"}
                </button>
              </div>
            </li>
            <li>
              Wait for the line that says the engine is ready. This page will switch to <strong>ONLINE</strong> by
              itself within 10 seconds, or press “Check again”.
            </li>
          </ol>
          <p>
            <strong>Browser permissions:</strong> when this page first talks to your computer, Chrome or Edge may ask
            to <em>“look for and connect to other apps and devices on your local network / this device.”</em> Choose{" "}
            <strong>Allow</strong>. If you chose Block earlier, click the padlock next to the address, open Site
            settings, and set Local network access to Allow.
          </p>
          <p>
            <strong>Still offline?</strong> The engine must allow this website in its CORS settings (see{" "}
            <code>cors_patch.py</code> in the bundle). Safari may block a secure page from reaching{" "}
            <code>http://127.0.0.1</code>; in that case use Chrome/Firefox, or run this dashboard locally with{" "}
            <code>npm run dev</code> / the static copy in the bundle.
          </p>
          <p className="muted small-print">Technical detail: {health.error}</p>
        </div>
      )}
    </section>
  );
}
