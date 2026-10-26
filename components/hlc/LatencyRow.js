// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
export default function LatencyRow({ latencyMs }) {
  return (
    <section aria-labelledby="lat-h">
      <h2 id="lat-h">Speed</h2>
      <div className="latency-row">
        <div className="latency-pill">
          <div className="label">Measured by this page (last prediction)</div>
          <div className="value" data-testid="measured-latency">
            {latencyMs === null ? "Measured: — (no prediction yet)" : `Measured: ${Math.round(latencyMs)} ms`}
          </div>
          <div className="muted small-print">
            Browser round trip for POST /predict, including network and JSON handling (and a CORS pre-check on the first
            call). It is larger than the engine’s own inference time.
          </div>
        </div>
        <div className="latency-pill">
          <div className="label">Developer’s stated spec (not measured here)</div>
          <div className="value">Inference: &lt; 15ms | Local CPU | Zero Cloud Latency</div>
        </div>
      </div>
    </section>
  );
}
