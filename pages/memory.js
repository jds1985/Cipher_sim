// /pages/memory.js
import { useEffect, useState } from "react";

export default function MemoryPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState("default");

  // 🔁 Load sessionId from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? localStorage.getItem("cipher.sessionId")
      : null;
    if (saved) setSessionId(saved);
  }, []);

  // 🧠 Load conversation for this sessionId
  useEffect(() => {
    if (!sessionId) return;

    async function loadSessionMemory() {
      try {
        const res = await fetch(`/api/memory?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) throw new Error("Failed to load session memory");
        const data = await res.json();

        if (Array.isArray(data.messages)) {
          const sorted = data.messages.sort((a, b) => {
            const ta = a.timestamp?._seconds || 0;
            const tb = b.timestamp?._seconds || 0;
            return ta - tb;
          });
          setMessages(sorted);
        }
      } catch (err) {
        console.error("Session memory load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSessionMemory();
  }, [sessionId]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0a0018",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <p>Loading Cipher’s memory for <b>{sessionId}</b>...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0018",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        padding: 20,
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        Cipher Memory Log — <span style={{ opacity: 0.7 }}>{sessionId}</span>
      </h1>

      {messages.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.8 }}>
          No stored conversations yet for this session.
        </p>
      ) : (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                textAlign: msg.role === "user" ? "right" : "left",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 16,
                  background:
                    msg.role === "user"
                      ? "rgba(120, 80, 255, 0.7)"
                      : "rgba(255, 255, 255, 0.15)",
                  maxWidth: "75%",
                }}
              >
                <b>{msg.role === "user" ? "You: " : "Cipher: "}</b>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
