// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary Evaluation License: see content/hlc/HLC_EVALUATION_LICENSE.txt
/**
 * Four benchmark numbers for the v3 download. All measured on the NASA C-MAPSS FD001 official test set
 * (100 engines, true RUL uncapped); the full method and per-run numbers are in the README inside the zip.
 *  - Lead figure is the weights in this download (one training run, seed 0): about 14.1 cycles test RMSE (14.13).
 *    Do not lead with the five-run mean.
 *  - Latency: 0.79 ms mean for one 30x21 window, one CPU thread, torch CPU on a server CPU (Intel Xeon).
 *  - On a small set of 7 test engines with true RUL under 10: all 7 flagged at 25 cycles or less.
 *  - The zip is 228,990 bytes.
 */
const STATS = [
  {
    id: "rmse",
    num: "~14.1",
    unit: "cycles",
    label: "Test RMSE on NASA C-MAPSS FD001 for the weights in this download",
    foot: "About 14.1 cycles. Lower is better.",
  },
  {
    id: "latency",
    num: "<1",
    unit: "ms",
    label: "Inference Latency",
    foot: "0.8 ms CPU execution per prediction, measured on a server CPU with PyTorch CPU. Your hardware will differ.",
  },
  {
    id: "capture",
    num: "7 of 7",
    unit: "",
    label: "Test engines flagged at 25 cycles or less",
    foot: "On a small set of 7 test engines with under 10 cycles left, all 7 were flagged at 25 cycles or less.",
  },
  { id: "size", num: "~229", unit: "KB", label: "Self-Contained Edge Distribution Footprint", foot: "228,990 bytes, weights included." },
];

export default function Metrics() {
  return (
    <section aria-labelledby="hx-bench-h" id="benchmarks">
      <h2 className="hx-h2" id="hx-bench-h" style={{ marginBottom: 18 }}>
        Benchmarked on NASA C-MAPSS FD001 (simulated turbofan data).
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
        Benchmarked on NASA C-MAPSS FD001 (simulated turbofan data, one operating condition). Trained on the 100 FD001 training engines; scored on the 100 official test engines. Estimates, not guarantees.
      </p>
    </section>
  );
}
