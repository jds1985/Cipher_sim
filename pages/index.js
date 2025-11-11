// /pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("default");
  const [sessionList, setSessionList] = useState(["default"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef(null);

  // Load saved sessionId from localStorage
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("cipher.sessionId")
        : null;
    if (saved) setSessionId(saved);
  }, []);

  // Persist sessionId locally
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cipher.sessionId", sessionId);
    }
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages for session
  async function loadMessages(sid = sessionId) {
    try {
      const res = await fetch(`/api/memory?sessionId=${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        const sorted = [...data.messages].sort(
          (a, b) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0)
        );
        setMessages(sorted);
        const found = new Set(["default"]);
        sorted.forEach((m) => {
          if (m.sessionId && typeof m.sessionId === "string") found.add(m.sessionId);
        });
        setSessionList([...found]);
      }
    } catch (err) {
      console.error("Memory fetch error:", err);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Send
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

      setMessages((prev) => [
        ...prev,
        { role: "user", text: out, sessionId, timestamp: { toMillis: () => Date.now() } },
        { role: "cipher", text: data.reply || "(no reply)", sessionId, timestamp: { toMillis: () => Date.now() } },
      ]);

      loadMessages();
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
          width: sidebarOpen ? 200 : 60,
          background: "rgba(255,255,255,0.04)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "2px 0 10px rgba(0,0,0,0.4)",
          transition: "width 0.3s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px 8px",
        }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            marginBottom: 10,
            fontSize: 18,
          }}
        >
          {sidebarOpen ? "⟨" : "⟩"}
        </button>

        {/* Session Orbs */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            overflowY: "auto",
            width: "100%",
          }}
        >
          {sessionList.sort().map((s) => {
            const active = s === sessionId;
            return (
              <button
                key={s}
                onClick={() => setSessionId(s)}
                title={s}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: active
                    ? "radial-gradient(circle at 40% 40%, #8b5cf6, #5b21b6)"
                    : "radial-gradient(circle at 40% 40%, #6b21a8, #1e1b4b)",
                  boxShadow: active
                    ? "0 0 12px 3px rgba(140,90,255,0.6)"
                    : "0 0 6px rgba(140,90,255,0.3)",
                  transition: "all 0.25s ease",
                }}
              ></button>
            );
          })}
        </div>

        {/* Add new session */}
        {sidebarOpen && (
          <input
            type="text"
            placeholder="New session..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                setSessionId(e.target.value.trim());
                e.target.value = "";
              }
            }}
            style={{
              width: "90%",
              padding: "8px 10px",
              marginTop: 10,
              marginBottom: 12,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 12,
            }}
          />
        )}
      </aside>

      {/* Main Chat */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 20,
        }}
      >
        <h1 style={{ marginBottom: 10 }}>Cipher AI 💬</h1>
        <div style={{ marginBottom: 8, opacity: 0.8 }}>
          Session: <strong>{sessionId}</strong>
        </div>

        {/* Chat area */}
        <div
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 640,
            overflowY: "auto",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 0 10px rgba(255,255,255,0.1)",
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
                      ? "rgba(90,55,230,0.8)"
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
            marginTop: 12,
            width: "100%",
            maxWidth: 640,
            display: "flex",
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
      </main>
    </div>
  );
}
