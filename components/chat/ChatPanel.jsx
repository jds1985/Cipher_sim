"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input; // Store current input before clearing
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          userId: "jim",
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        throw new Error("No reply from API");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ API error: " + err.message },
      ]);
    }
  }

  return (
    <div style={{ height: "100vh", background: "#000", color: "#fff", padding: 16, display: "flex", flexDirection: "column" }}>
      <h3 style={{ borderBottom: "1px solid #333", paddingBottom: 10 }}>CIPHER CHAT (RECOVERY)</h3>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            marginBottom: 12, 
            padding: "8px 12px", 
            borderRadius: "8px",
            background: m.role === "user" ? "#222" : "#111",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            border: m.role === "user" ? "1px solid #444" : "1px solid #222"
          }}>
            <strong style={{ color: m.role === "user" ? "#0070f3" : "#00ff00" }}>
              {m.role === "user" ? "YOU" : "CIPHER"}:
            </strong> 
            <p style={{ margin: "4px 0 0 0" }}>{m.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: "12px", 
            background: "#111", 
            border: "1px solid #333", 
            color: "#fff",
            borderRadius: "4px"
          }}
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            padding: "0 20px", 
            background: "#0070f3", 
            color: "#fff", 
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold"
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
