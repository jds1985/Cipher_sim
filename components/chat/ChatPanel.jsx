import { useState, useEffect, useRef } from "react";
import InputBar from "./InputBar";

export default function ChatPanel({ userId = "jim_default" }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("normal"); // normal | decipher | shadow
  const panelRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const cycleMode = () => {
    setMode((prev) =>
      prev === "normal" ? "decipher" : prev === "decipher" ? "shadow" : "normal"
    );
  };

  const modeLabel =
    mode === "normal" ? "Cipher" : mode === "decipher" ? "Decipher" : "ShadowFlip";

  async function sendMessage(text) {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode,
          userId,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Cipher returned no output.",
          mode,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Cipher encountered a server error.",
          mode,
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "#fff",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #222",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: 18 }}>Cipher</strong>

        <button
          onClick={cycleMode}
          style={{
            padding: "6px 12px",
            borderRadius: 20,
            border: "1px solid #444",
            background:
              mode === "normal"
                ? "#111"
                : mode === "decipher"
                ? "#1b2330"
                : "#2a1b1b",
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {modeLabel}
        </button>
      </div>

      {/* CHAT */}
      <div
        ref={panelRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              maxWidth: "80%",
              marginBottom: 10,
              padding: "10px 14px",
              borderRadius: 12,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background:
                m.role === "user"
                  ? "#222"
                  : m.mode === "decipher"
                  ? "#1b2330"
                  : m.mode === "shadow"
                  ? "#2a1b1b"
                  : "#111",
            }}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              maxWidth: "80%",
              padding: "10px 14px",
              borderRadius: 12,
              background: "#111",
              opacity: 0.7,
            }}
          >
            Cipher is thinking…
          </div>
        )}
      </div>

      {/* INPUT */}
      <InputBar onSend={sendMessage} />
    </div>
  );
  }
