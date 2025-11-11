// /pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState("default");
  const [sessions, setSessions] = useState([{ id: "default", name: "default" }]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [creating, setCreating] = useState(false);

  const chatEndRef = useRef(null);

  // Load saved sessionId
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("cipher.sessionId")
        : null;
    if (saved) setSessionId(saved);
  }, []);

  // Persist sessionId
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cipher.sessionId", sessionId);
    }
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (Array.isArray(data.sessions) && data.sessions.length) {
        setSessions(data.sessions);
        // Ensure active session exists in list
        const found = data.sessions.find((s) => s.id === sessionId || s.name === sessionId);
        if (!found) {
          // if not found, switch to default if present
          const def = data.sessions.find((s) => s.id === "default" || s.name === "default");
          if (def) setSessionId(def.name || def.id);
        }
      } else {
        // seed default
        setSessions([{ id: "default", name: "default" }]);
      }
    } catch (e) {
      console.error("fetchSessions error:", e);
    }
  }

  // Load messages for a session
  async function loadMessages(sid = sessionId) {
    try {
      const res = await fetch(`/api/memory?sessionId=${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        const sorted = [...data.messages].sort(
          (a, b) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0)
        );
        setMessages(sorted);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Memory fetch error:", err);
    }
  }

  // Initial loads
  useEffect(() => {
    fetchSessions();
  }, []);
  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Create a new session
  async function createSession(name) {
    const clean = (name || "").trim();
    if (!clean) return;
    setCreating(true);
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      await fetchSessions();
      setSessionId(clean);
    } catch (e) {
      console.error("createSession error:", e);
    } finally {
      setCreating(false);
    }
  }

  // Delete current session
  async function deleteSession(targetId) {
    const sid = targetId || sessionId;
    if (!sid) return;
    if (!confirm(`Delete session "${sid}" and all its messages?`)) return;

    try {
      const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(sid)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data?.ok) {
        await fetchSessions();
        // move to default after deletion
        setSessionId("default");
        await loadMessages("default");
      }
    } catch (e) {
      console.error("deleteSession error:", e);
    }
  }

  // Send message
  async function sendMessage() {
    if (!message.trim()) return;
    setLoading(true);
    const out = message;
    setMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: out, sessionId }),
      });
      const data = await res.json();

      // optimistic update
      const now = Date.now();
      setMessages((prev) => [
        ...prev,
        { role: "user", text: out, sessionId, timestamp: { toMillis: () => now } },
        { role: "cipher", text: data.reply || "(no reply)", sessionId, timestamp: { toMillis: () => now } },
      ]);

      // refresh canonical + update sessions order
      await loadMessages();
      await fetchSessions();
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
        background:
          "radial-gradient(1000px 700px at 50% -10%, #2c1a68 0%, #0a0018 60%, #070012 100%)",
        color: "#fff",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 260 : 64,
          background: "rgba(255,255,255,0.04)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "2px 0 10px rgba(0,0,0,0.4)",
          transition: "width 0.28s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: 10, gap: 8 }}>
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            title="Toggle sidebar"
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,.18)",
              borderRadius: 8,
              color: "#aaa",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            {sidebarOpen ? "⟨" : "⟩"}
          </button>
          {sidebarOpen && <div style={{ opacity: 0.8 }}>Sessions</div>}
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: "auto", padding: sidebarOpen ? "0 10px" : 0 }}>
          {sessions.map((s) => {
            const name = s.name || s.id;
            const active = name === sessionId;
            return (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <button
                  onClick={() => setSessionId(name)}
                  title={name}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    background: active
                      ? "linear-gradient(90deg, rgba(139,92,246,.28), rgba(91,33,182,.22))"
                      : "transparent",
                    border: "1px solid rgba(255,255,255,.14)",
                    borderRadius: 10,
                    color: "#fff",
                    padding: sidebarOpen ? "10px 12px" : "10px 8px",
                    cursor: "pointer",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sidebarOpen ? name : name.slice(0, 1).toUpperCase()}
                </button>
                {/* delete */}
                {sidebarOpen && name !== "default" && (
                  <button
                    onClick={() => deleteSession(name)}
                    title="Delete session"
                    style={{
                      background: "rgba(255,80,80,.15)",
                      border: "1px solid rgba(255,80,80,.35)",
                      color: "#fff",
                      borderRadius: 8,
                      cursor: "pointer",
                      padding: "8px 10px",
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Create new */}
        <div style={{ padding: sidebarOpen ? 10 : 6, borderTop: "1px solid rgba(255,255,255,.1)" }}>
          {sidebarOpen ? (
            <input
              type="text"
              placeholder={creating ? "Creating…" : "New session name…"}
              disabled={creating}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createSession(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            />
          ) : (
            <button
              onClick={() => {
                const name = prompt("New session name:");
                if (name) createSession(name);
              }}
              style={{
                width: "100%",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.18)",
                color: "#fff",
                borderRadius: 10,
                padding: "8px 6px",
                cursor: "pointer",
              }}
            >
              ＋
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 20,
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Cipher AI 💬</h1>
        <div style={{ marginBottom: 10, opacity: 0.85 }}>
          Session: <strong>{sessionId}</strong>
        </div>

        {/* Chat */}
        <div
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 680,
            overflowY: "auto",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 0 10px rgba(255,255,255,0.1)",
          }}
        >
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", marginBottom: 12 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 18,
                  background: m.role === "user" ? "rgba(90,55,230,0.8)" : "rgba(255,255,255,0.15)",
                  maxWidth: "80%",
                  wordWrap: "break-word",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Composer */}
        <div style={{ marginTop: 12, width: "100%", maxWidth: 680, display: "flex", gap: 8 }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type to Cipher…"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              outline: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: loading ? "#555" : "#7D3CFF",
              color: "#fff",
              cursor: "pointer",
              minWidth: 90,
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}
