import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("default");
  const [newSession, setNewSession] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Load saved sessionId from localStorage
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("cipher.sessionId")
        : null;
    if (saved) setSessionId(saved);
  }, []);

  // Persist current sessionId locally
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cipher.sessionId", sessionId);
    }
  }, [sessionId]);

  // Fetch all sessions
  async function loadSessions() {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
    } catch (err) {
      console.error("Session load error:", err);
    }
  }

  // Load chat messages for current session
  async function loadMessages(sid = sessionId) {
    try {
      const res = await fetch(`/api/memory?sessionId=${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch (err) {
      console.error("Memory fetch error:", err);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Auto-scroll to bottom on message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a new message
  async function sendMessage() {
    if (!message.trim()) return;
    const out = message;
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: out, sessionId }),
      });
      const data = await res.json();

      // Optimistic UI
      setMessages((prev) => [
        ...prev,
        { role: "user", text: out },
        { role: "cipher", text: data.reply || "(no reply)" },
      ]);

      await loadMessages(sessionId);
      await loadSessions();
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Create a new session
  async function createSession() {
    const name = newSession.trim();
    if (!name) return;
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setSessionId(name);
      setNewSession("");
      await loadSessions();
      await loadMessages(name);
    } catch (err) {
      console.error("Create session error:", err);
    }
  }

  // Delete current session
  async function deleteSession(id) {
    if (!confirm(`Delete session "${id}"?`)) return;
    try {
      await fetch(`/api/sessions?sessionId=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadSessions();
      if (sessionId === id) setSessionId("default");
      await loadMessages("default");
    } catch (err) {
      console.error("Delete session error:", err);
    }
  }

  return (
    <main
      style={{
        display: "flex",
        height: "100vh",
        background:
          "radial-gradient(1000px 700px at 50% -10%, #2c1a68 0%, #0a0018 60%, #070012 100%)",
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: "rgba(255,255,255,0.06)",
          borderRight: "1px solid rgba(255,255,255,0.15)",
          padding: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Sessions</h3>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setSessionId(s.name || s.id)}
              style={{
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 8,
                background:
                  sessionId === (s.name || s.id)
                    ? "rgba(125,60,255,0.7)"
                    : "rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14 }}>{s.name || s.id}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(s.id);
                }}
                style={{
                  background: "none",
                  color: "#aaa",
                  border: "none",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* New session input */}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={newSession}
            onChange={(e) => setNewSession(e.target.value)}
            placeholder="New session"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6,
              padding: "6px 8px",
            }}
          />
          <button
            onClick={createSession}
            style={{
              background: "#7D3CFF",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 20,
          overflow: "hidden",
        }}
      >
        <h1 style={{ marginBottom: 10 }}>Cipher AI 💬</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Session: <strong>{sessionId}</strong>
        </p>

        {/* Chat window */}
        <div
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 700,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 14,
            overflowY: "auto",
            boxShadow: "0 0 20px rgba(255,255,255,0.1)",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.role === "user" ? "right" : "left",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 18,
                  background:
                    m.role === "user"
                      ? "rgba(125,60,255,0.8)"
                      : "rgba(255,255,255,0.15)",
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
        <div
          style={{
            marginTop: 10,
            display: "flex",
            width: "100%",
            maxWidth: 700,
            gap: 8,
          }}
        >
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
      </section>
    </main>
  );
}
