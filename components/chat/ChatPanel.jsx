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
        body: JSON.stringify({
          message: currentInput,
          mode: isDecipher ? "decipher" : "cipher"
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "No response" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Connection Error" }]);
    }
  }

  return (
    <div style={{ height: "100vh", background: "#000", color: "#fff", padding: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: 10 }}>
        <h3 style={{ margin: 0 }}>{isDecipher ? "DECIPHER_MODE" : "CIPHER_CORE"}</h3>
        <button 
          onClick={() => setIsDecipher(!isDecipher)}
          style={{ background: isDecipher ? "#ff0000" : "#0070f3", color: "white", border: "none", borderRadius: "4px", padding: "8px 12px", cursor: "pointer", fontWeight: "bold" }}
        >
          {isDecipher ? "GO LIGHT" : "GO DARK"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", margin: "16px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: m.role === "user" ? "#222" : "#111", border: `1px solid ${isDecipher && m.role !== "user" ? "#ff0000" : "#333"}` }}>
            <strong style={{ color: m.role === "user" ? "#0070f3" : (isDecipher ? "#ff0000" : "#00ff00") }}>
              {m.role === "user" ? "USER" : (isDecipher ? "DECIPHER" : "CIPHER")}:
            </strong>
            <p style={{ margin: "5px 0 0 0" }}>{m.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input 
          style={{ flex: 1, padding: 12, background: "#111", border: "1px solid #333", color: "#fff", borderRadius: "4px" }} 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && sendMessage()} 
          placeholder="Initiate dialogue..." 
        />
        <button onClick={sendMessage} style={{ padding: "0 20px", background: isDecipher ? "#ff0000" : "#0070f3", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold" }}>SEND</button>
      </div>
    </div>
  );
}
