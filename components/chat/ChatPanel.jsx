"use client";
import { useState, useEffect, useRef } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isDecipher, setIsDecipher] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, mode: isDecipher ? "decipher" : "cipher" }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "SIGNAL LOST..." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ ERROR: CONNECTION_FAILED" }]);
    }
  }

  const themeColor = isDecipher ? "#ff003c" : "#00f3ff";

  return (
    <div style={{ height: "100vh", background: "#050505", color: themeColor, padding: "10px", display: "flex", flexDirection: "column", fontFamily: "monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${themeColor}`, paddingBottom: "10px" }}>
        <h2 style={{ margin: 0 }}>{isDecipher ? ">> DECIPHER_OS" : ">> CIPHER_CORE"}</h2>
        <button 
          onClick={() => setIsDecipher(!isDecipher)}
          style={{ background: "transparent", color: themeColor, border: `1px solid ${themeColor}`, padding: "5px 10px", cursor: "pointer" }}
        >
          {isDecipher ? "REBOOT" : "SYNC_DARK"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", margin: "15px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "15px", borderLeft: `2px solid ${m.role === "user" ? "#555" : themeColor}`, paddingLeft: "10px" }}>
            <p style={{ margin: 0, color: m.role === "user" ? "#fff" : themeColor }}>{m.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: "10px", background: "#111", padding: "10px", border: `1px solid ${themeColor}` }}>
        <input 
          style={{ flex: 1, background: "transparent", border: "none", color: "#fff", outline: "none" }} 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && sendMessage()} 
          placeholder="Enter command..." 
        />
        <button onClick={sendMessage} style={{ background: themeColor, color: "#000", border: "none", padding: "0 15px", fontWeight: "bold" }}>EXE</button>
      </div>
    </div>
  );
}
