// components/chat/ChatPanel.jsx
import { useState, useEffect, useRef } from "react";
import InputBar from "./InputBar";
import Header from "../ui/Header";
import RightDrawer from "../ui/RightDrawer";

export default function ChatPanel({ userId = "jim_default", theme }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId }),
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply || "Cipher is thinking…" }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error: Cipher could not respond." }
      ]);
    }

    setLoading(false);
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: theme?.background || "black",
      color: theme?.textColor || "white",
      overflow: "hidden",
    }}>

      <Header onMenuClick={() => setDrawerOpen(true)} />
      <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div
        ref={panelRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{
            background: m.role === "user" ? "#222" : "#111",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "10px",
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "80%",
          }}>
            {m.content}
          </div>
        ))}

        {loading && (
          <div style={{
            background: "#111",
            padding: "12px",
            borderRadius: "10px",
            maxWidth: "80%",
          }}>
            … Cipher is processing …
          </div>
        )}
      </div>

      <InputBar onSend={sendMessage} />
    </div>
  );
}
