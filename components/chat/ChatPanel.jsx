// components/ChatPanel.jsx
// Cipher Chat Panel 10.0 – Stable + Minimal UI Logic

import { useState, useEffect, useRef } from "react";
import InputBar from "./InputBar";

export default function ChatPanel({ userId = "jim_default" }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim()) return;

    const newMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId }),
      });

      const data = await res.json();

      const reply = {
        role: "assistant",
        content: data.reply || "Cipher is thinking…",
      };

      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Cipher couldn't respond." },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-panel" ref={panelRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "msg user" : "msg cipher"}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="msg cipher">
            <em>… Cipher is processing …</em>
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} />
    </div>
  );
}
