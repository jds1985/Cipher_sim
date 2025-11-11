// /pages/memory.js
import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebaseConfig"; // ← ensure this file is at project root
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";

// Orb colors by role/type
const TYPE_COLORS = {
  user: "#5B2CF2",
  cipher: "#9B59B6",
  memory: "#6A5ACD",
  reflection: "#00CED1",
  insight: "#E67E22",
  system: "#7E8C8D",
};

export default function MemoryField() {
  const [memories, setMemories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sessionId, setSessionId] = useState("default");
  const [search, setSearch] = useState("");
  const [allSessions, setAllSessions] = useState(["default"]);
  const [newSessionName, setNewSessionName] = useState("");
  const wrapRef = useRef(null);

  // Load/persist chosen session
  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? localStorage.getItem("cipher.sessionId")
      : null;
    if (saved) setSessionId(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cipher.sessionId", sessionId);
    }
  }, [sessionId]);

  // 🔴 Live subscription to Firestore (client-side)
  // NOTE: we avoid "where" so you don't need composite indexes.
  // We fetch latest 800 docs by time, then filter in memory.
  useEffect(() => {
    const baseRef = collection(db, "cipher_memory");
    const q = query(baseRef, orderBy("timestamp", "desc"), limit(800));

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Build a session list for the dropdown
      const sessionSet = new Set(["default"]);
      rows.forEach((r) => {
        if (r.sessionId && typeof r.sessionId === "string") sessionSet.add(r.sessionId);
      });
      setAllSessions(Array.from(sessionSet).sort());
      // We’ll flip to ASC for display after filtering
      setMemories(rows);
    });

    return () => unsub();
  }, []);

  // 🔎 Filter, search, and order ASC for the grid
  const filteredAsc = useMemo(() => {
    const t = typeFilter.toLowerCase();
    const s = search.trim().toLowerCase();

    const keep = memories.filter((m) => {
      // Filter by selected session:
      const bySession =
        (m.sessionId || "default") === sessionId;

      // Filter by type:
      const roleType = (m.type || m.role || "memory").toLowerCase();
      const byType = t === "all" ? true : roleType === t;

      // Filter by search:
      const text = (m.text || "").toString().toLowerCase();
      const bySearch = s ? text.includes(s) : true;

      return bySession && byType && bySearch;
    });

    // Oldest → newest for display
    return keep.sort((a, b) => {
      const ta = (a.timestamp?.toMillis?.() ?? 0);
      const tb = (b.timestamp?.toMillis?.() ?? 0);
      return ta - tb;
    });
  }, [memories, typeFilter, search, sessionId]);

  // Deterministic jittered grid
  const laidOut = useMemo(() => {
    const cols = 10; // columns
    const pad = 18;  // spacing
    return filteredAsc.map((m, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = c * pad + (c % 2) * 6;
      const y = r * pad + ((c + r) % 3) * 4;
      return { ...m, x, y };
    });
  }, [filteredAsc]);

  // Add a new session name (local only until messages are saved under it)
  function addSession() {
    const name = (newSessionName || "").trim();
    if (!name) return;
    if (!allSessions.includes(name)) {
      setAllSessions((prev) => [...prev, name].sort());
    }
    setSessionId(name);
    setNewSessionName("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#fff",
        background:
          "radial-gradient(1200px 800px at 50% -10%, #2c1a68 0%, #0a0018 60%, #070012 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 16,
      }}
    >
      {/* Header / Controls */}
      <header
        style={{
          maxWidth: 1100,
          margin: "0 auto 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26, letterSpacing: 0.3 }}>
          Cipher – Memory Field
        </h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Session select */}
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            style={selStyle}
            title="Session"
          >
            {allSessions.map((s) => (
              <option key={s} value={s}>
                Session: {s}
              </option>
            ))}
          </select>

          {/* Quick new session */}
          <input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="New session name…"
            style={{ ...inputStyle, minWidth: 160 }}
          />
          <button onClick={addSession} style={btnStyle}>Add</button>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={selStyle}
            title="Filter by type"
          >
            <option value="all">All types</option>
            <option value="user">User</option>
            <option value="cipher">Cipher</option>
            <option value="memory">Memory</option>
            <option value="reflection">Reflection</option>
            <option value="insight">Insight</option>
            <option value="system">System</option>
          </select>

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search text…"
            style={inputStyle}
          />
        </div>
      </header>

      {/* Field */}
      <section
        ref={wrapRef}
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          borderRadius: 14,
          padding: 18,
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 0 40px rgba(130, 90, 240, 0.25) inset",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: 500,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(10, 1fr)",
              gap: 12,
            }}
          >
            {laidOut.map((m) => {
              const t = (m.type || m.role || "memory").toLowerCase();
              const color = TYPE_COLORS[t] || "#5B2CF2";
              const size = 14 + Math.min(10, Math.floor((m.text || "").length / 120));

              return (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  title={(m.text || "").slice(0, 140)}
                  style={{
                    cursor: "pointer",
                    aspectRatio: "1 / 1",
                    borderRadius: 999,
                    border: "none",
                    background: `radial-gradient(circle at 35% 30%, ${hexA(
                      color,
                      0.95
                    )} 0%, ${hexA(color, 0.6)} 45%, rgba(255,255,255,0.06) 100%)`,
                    boxShadow: `0 0 18px ${hexA(color, 0.5)}, inset 0 0 24px ${hexA(
                      color,
                      0.5
                    )}`,
                    transform: `scale(${size / 18})`,
                    transition: "transform 140ms ease, box-shadow 140ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = `scale(${size / 18 + 0.05})`;
                    e.currentTarget.style.boxShadow = `0 0 26px ${hexA(
                      color,
                      0.75
                    )}, inset 0 0 30px ${hexA(color, 0.6)}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `scale(${size / 18})`;
                    e.currentTarget.style.boxShadow = `0 0 18px ${hexA(
                      color,
                      0.5
                    )}, inset 0 0 24px ${hexA(color, 0.5)}`;
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Details Drawer */}
      {selected && (
        <div style={drawerWrapStyle} onClick={() => setSelected(null)}>
          <div style={drawerStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0 }}>
                {capitalize(selected.type || selected.role || "memory")}
              </h3>
              <button onClick={() => setSelected(null)} style={closeBtnStyle}>
                ✕
              </button>
            </div>
            <p
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
                opacity: 0.95,
                marginTop: 12,
              }}
            >
              {selected.text || "(no text)"}
            </p>
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
              <div>
                <strong>Session:</strong> {selected.sessionId || "default"}
              </div>
              {selected.timestamp?.toDate && (
                <div>
                  <strong>When:</strong>{" "}
                  {selected.timestamp.toDate().toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ——— styles/helpers ——— */
const selStyle = {
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "8px 10px",
  borderRadius: 10,
};

const inputStyle = {
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "8px 10px",
  borderRadius: 10,
  minWidth: 180,
};

const btnStyle = {
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
};

const drawerWrapStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 50,
};

const drawerStyle = {
  width: "min(720px, 92vw)",
  background: "linear-gradient(180deg, rgba(20,10,40,.9), rgba(10,4,22,.95))",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 20px 80px rgba(0,0,0,.55)",
};

const closeBtnStyle = {
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
};

function capitalize(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// convert #rrggbb to rgba string with alpha
function hexA(hex, a = 1) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
