// /pages/memory.js
import { useEffect, useState } from "react";

export default function MemoryPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all stored messages from Firestore via /api/memory
  useEffect(() => {
    async function loadMemory() {
      try {
        const res = await fetch("/api/memory");
        if (!res.ok) throw new Error("Failed to load memory");
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          // sort by timestamp if not already sorted
          const sorted = data.messages.sort((a, b) => {
            const ta = a.timestamp?._seconds || 0;
            const tb = b.timestamp?._seconds || 0;
            return ta - tb;
          });
          setMessages(sorted);
        }
      } catch (err) {
        console.error("Memory load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMemory();
  }, []);

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
        <p>Loading Cipher’s memory...</p>
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
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Cipher Memory Log</h1>

      {messages.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.8 }}>No stored conversations yet.</p>
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
