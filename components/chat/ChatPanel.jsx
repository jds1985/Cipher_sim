"use client";

import { useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("ONLINE");

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStatus("TRANSMITTING…");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          userId: "jim"
        })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply || "⚠️ No reply" }
      ]);

      setStatus("ONLINE");
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "❌ SIGNAL LOST…" }
      ]);
      setStatus("OFFLINE");
    }
  }

  return (
    <div style={{ height: "100vh", background: "#000", color: "#0ff", padding: 16 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3>&gt;&gt; CIPHER_CORE</h3>
        <span>{status}</span>
      </div>

      {/* CHAT WINDOW */}
      <div style={{ marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message"
          style={{ width: "70%", padding: 8 }}
        />
        <button onClick={sendMessage} style={{ marginLeft: 8, padding: 8 }}>
          Send
        </button>
      </div>
    </div>
  );
}