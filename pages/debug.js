import { useEffect, useState } from "react";

export default function DebugDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    try {
      setErr(null);
      const r = await fetch("/api/cipher-debug");
      const j = await r.json();
      setData(j);
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  async function clear() {
    try {
      await fetch("/api/cipher-debug?action=clear", { method: "POST" });
      await load();
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  const scores = data?.scores || {};
  const runs = data?.runs || [];
  const last = data?.lastRun || null;

  return (
    <div style={S.page}>
      <div style={S.headerRow}>
        <div>
          <div style={S.h1}>Cipher Debug Dashboard</div>
          <div style={S.sub}>
            Live routing + reliability + latency (best-effort, resets on cold start)
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btn} onClick={load}>refresh</button>
          <button style={S.btnDanger} onClick={clear}>clear</button>
        </div>
      </div>

      {err && <div style={S.err}>Error: {err}</div>}

      <div style={S.grid}>
        {/* LAST RUN */}
        <div style={S.card}>
          <div style={S.cardTitle}>Last Run</div>
          {!last ? (
            <div style={S.muted}>No runs recorded yet.</div>
          ) : (
            <div style={S.kv}>
              <KV k="intent" v={last.intent} />
              <KV k="chosen" v={last.chosen} />
              <KV k="latencyMs" v={last.latencyMs} />
              <KV k="stream" v={String(last.stream)} />
              <KV k="success" v={String(last.success)} />
              <KV k="orderTried" v={(last.orderTried || []).join(" → ")} />
            </div>
          )}
        </div>

        {/* SCORES */}
        <div style={S.card}>
          <div style={S.cardTitle}>Provider Scoreboard</div>
          <div style={S.muted}>score = reliability(80%) + speed(20%)</div>

          <div style={{ marginTop: 10 }}>
            {Object.keys(scores).length === 0 ? (
              <div style={S.muted}>No score data yet.</div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>provider</th>
                    <th style={S.th}>score</th>
                    <th style={S.th}>success</th>
                    <th style={S.th}>fail</th>
                    <th style={S.th}>avg ms</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(scores).map(([p, row]) => (
                    <tr key={p}>
                      <td style={S.td}>{p}</td>
                      <td style={S.td}>{row.score}</td>
                      <td style={S.td}>{row.success}</td>
                      <td style={S.td}>{row.fail}</td>
                      <td style={S.td}>{row.avgLatency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RECENT RUNS */}
        <div style={{ ...S.card, gridColumn: "1 / -1" }}>
          <div style={S.cardTitle}>Recent Runs</div>

          {runs.length === 0 ? (
            <div style={S.muted}>No runs recorded yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {runs.map((r, i) => (
                <div key={i} style={S.runRow}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Tag label={new Date(r.timestamp).toLocaleTimeString()} />
                    <Tag label={`intent: ${r.intent}`} />
                    <Tag label={`chosen: ${r.chosen || "none"}`} />
                    {r.model ? <Tag label={`model: ${r.model}`} /> : null}
                    <Tag label={`ms: ${r.latencyMs || 0}`} />
                    <Tag label={`stream: ${String(r.stream)}`} />
                    <Tag label={`success: ${String(r.success)}`} good={r.success} bad={!r.success} />
                    {r.pseudoStream ? <Tag label="pseudo-stream" /> : null}
                    {r.error ? <Tag label={`error: ${r.error}`} bad /> : null}
                  </div>

                  <div style={S.mutedSmall}>
                    {Array.isArray(r.orderTried) && r.orderTried.length
                      ? `order: ${r.orderTried.join(" → ")}`
                      : "order: —"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={S.footerNote}>
        Tip: open <span style={S.mono}>/debug</span> on desktop while you test chat.
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={S.kvRow}>
      <div style={S.k}>{k}</div>
      <div style={S.v}>{String(v ?? "—")}</div>
    </div>
  );
}

function Tag({ label, good = false, bad = false }) {
  return (
    <div
      style={{
        ...S.tag,
        border: bad
          ? "1px solid rgba(255,90,90,0.45)"
          : good
          ? "1px solid rgba(90,255,170,0.35)"
          : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {label}
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    padding: 18,
    color: "rgba(245,245,245,0.96)",
    background:
      "radial-gradient(1200px 700px at 20% 0%, rgba(120,90,255,0.25), transparent 60%), radial-gradient(1000px 700px at 80% 20%, rgba(180,120,255,0.18), transparent 55%), rgba(8,6,12,1)",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 14,
  },
  h1: { fontSize: 22, fontWeight: 800, letterSpacing: 0.3 },
  sub: { opacity: 0.75, fontSize: 13, marginTop: 4 },
  btn: {
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(245,245,245,0.92)",
  },
  btnDanger: {
    cursor: "pointer",
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,90,90,0.12)",
    border: "1px solid rgba(255,90,90,0.35)",
    color: "rgba(245,245,245,0.92)",
  },
  err: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,90,90,0.12)",
    border: "1px solid rgba(255,90,90,0.35)",
    marginBottom: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(190,150,255,0.14)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  cardTitle: { fontSize: 14, fontWeight: 800, opacity: 0.92 },
  muted: { opacity: 0.7, fontSize: 12, marginTop: 6 },
  mutedSmall: { opacity: 0.6, fontSize: 12, marginTop: 6 },
  kv: { marginTop: 10, display: "grid", gap: 8 },
  kvRow: { display: "flex", justifyContent: "space-between", gap: 10 },
  k: { opacity: 0.65, fontSize: 12 },
  v: { fontSize: 12, fontWeight: 700 },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  th: {
    textAlign: "left",
    fontSize: 12,
    opacity: 0.75,
    padding: "8px 6px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  td: {
    fontSize: 12,
    padding: "8px 6px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  runRow: {
    padding: 12,
    borderRadius: 14,
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  tag: {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    background: "rgba(255,255,255,0.04)",
  },
  footerNote: { marginTop: 14, opacity: 0.65, fontSize: 12 },
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
};
