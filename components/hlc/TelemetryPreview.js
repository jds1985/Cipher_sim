// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
import { channelStats, TIMESTEPS } from "../../lib/hlc/telemetry";

function describe(col, range) {
  if (col.every((v) => v === 0)) return "all zeros";
  if (range < 1e-9) return "flat (constant)";
  // frozen tail: last >=10 values identical
  let n = 1;
  for (let i = col.length - 2; i >= 0 && col[i] === col[col.length - 1]; i--) n++;
  if (n >= 10) return `frozen last ${n} steps`;
  return "";
}

export default function TelemetryPreview({ matrix, dropped }) {
  const stats = channelStats(matrix);
  const droppedMap = new Map(dropped.map((d) => [d.channel, d.kind]));

  return (
    <div>
      <div className="legend" aria-hidden="true">
        <span>Low value</span>
        <span className="legend-bar" />
        <span>High value</span>
      </div>
      <p className="muted small-print" style={{ marginTop: 0 }}>
        Each row is one sensor channel (S01–S21); each column is one of the {TIMESTEPS} time steps, oldest on the left.
        Brightness is scaled within each row. Text on the right gives the exact min–max and any fault.
      </p>
      <div className="heat-scroll" tabIndex={0} role="group" aria-label="Telemetry heat grid, 21 channels by 30 time steps. Scrollable.">
        <div className="heat">
          {stats.map((s, c) => {
            const col = matrix.map((r) => r[c]);
            const range = s.max - s.min;
            const tag = describe(col, range);
            const d = droppedMap.get(c);
            return (
              <div className="heat-row" key={c}>
                <span className="heat-label">S{String(c + 1).padStart(2, "0")}</span>
                <span className="heat-cells" aria-hidden="true">
                  {col.map((v, t) => {
                    const n = range < 1e-9 ? 0.5 : (v - s.min) / range;
                    const l = 8 + n * 84;
                    return <span key={t} style={{ background: `hsl(205 90% ${l}%)` }} />;
                  })}
                </span>
                <span className="heat-tag">
                  {s.min.toFixed(3)}–{s.max.toFixed(3)}{" "}
                  {d ? (
                    <span className="dropped">DROPPED · {d === "zeroed" ? "zeros" : "frozen"}</span>
                  ) : tag ? (
                    <span>· {tag}</span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="axis" aria-hidden="true">
        <span>◀ step 1 (oldest)</span>
        <span>step {TIMESTEPS} (newest) ▶</span>
      </div>
      <details>
        <summary>Show the raw numbers (30 rows × 21 columns)</summary>
        <div className="table-scroll" tabIndex={0} role="group" aria-label="Raw telemetry numbers, scrollable">
          <table className="raw">
            <thead>
              <tr>
                <th scope="col">Step</th>
                {stats.map((_, c) => (
                  <th scope="col" key={c}>
                    S{String(c + 1).padStart(2, "0")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, t) => (
                <tr key={t}>
                  <th scope="row">{t + 1}</th>
                  {row.map((v, c) => (
                    <td key={c}>{v.toFixed(4)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
