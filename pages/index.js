import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch (err) {
      console.error("Error loading memory:", err);
    }
  }

  async function sendMessage() {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMsg, timestamp: Date.now() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();
      const reply = data.reply || "(no reply)";

      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: reply, timestamp: Date.now() },
      ]);

      await loadMessages(); // reload to sync Firestore
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0b001a 0%, #150035 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 20,
      }}
    >
      <h1 style={{ marginBottom: 10, fontWeight: 700 }}>Cipher AI 💬</h1>

      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 640,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: 14,
          overflowY: "auto",
          boxShadow: "0 0 12px rgba(255,255,255,0.1)",
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
                    : "rgba(255,255,255,0.12)",
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
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type to Cipher…"
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
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </main>
  );
}
