// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
/**
 * Four benchmark numbers. All measured in the retraining run (see docs/RESULTS.md in the HLC project):
 *  - Test RMSE 15.29 cycles (official 100-engine FD001 test set, true RUL uncapped).
 *  - Pearson r = 0.930 between predicted and true RUL over those 100 test engines (one end-of-run prediction each).
 *  - 19 test engines have true RUL under 25: the engine flagged 15 as CRITICAL and 4 as WARNING; 0 were left NOMINAL.
 *  - The download is 805,331 bytes = 786 KiB.
 */
const STATS = [
  { id: "rmse", num: "15.3", unit: "cycles", label: "Test RMSE on the NASA C-MAPSS FD001 test set", foot: "Lower is better. Average miss is about 15 cycles." },
  { id: "corr", num: "0.93", unit: "", label: "Predicted-vs-True Life Correlation", foot: "Pearson r across all 100 test engines." },
  {
    id: "capture",
    num: "100%",
    unit: "",
    label: "Imminent Failure Capture Rate (flagged CRITICAL or WARNING)",
    foot: "Of 19 engines within 25 cycles of failure: 15 CRITICAL, 4 WARNING, 0 missed",
  },
  { id: "size", num: "~786", unit: "KB", label: "Self-Contained Edge Distribution Footprint", foot: "805,331 bytes, weights included." },
];

export default function Metrics() {
  return (
    <section aria-labelledby="hx-bench-h" id="benchmarks">
      <h2 className="hx-h2" id="hx-bench-h" style={{ marginBottom: 18 }}>
        Proven on real turbofan data
      </h2>
      <ul className="hx-metrics" style={{ listStyle: "none", padding: 0, margin: 0 }} data-testid="metric-strip">
        {STATS.map((s) => (
          <li className="hx-stat" key={s.id} data-testid={`stat-${s.id}`}>
            <div>
              <span className="hx-stat-num">{s.num}</span>{" "}
              {s.unit && <span className="hx-stat-unit">{s.unit}</span>}
            </div>
            <div className="hx-stat-label">{s.label}</div>
            <div className="hx-stat-foot">{s.foot}</div>
          </li>
        ))}
      </ul>
      <p className="hx-bench-foot" data-testid="bench-footnote">
        Benchmarked on NASA C-MAPSS FD001 (simulated turbofan data).
      </p>
    </section>
  );
}
