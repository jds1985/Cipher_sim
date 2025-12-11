// components/ChatPanel.jsx
// Cipher Chat Panel 11.0 – Header + Right Drawer + Chat Logic

import { useState, useEffect, useRef } from "react";
import InputBar from "./InputBar";
import Header from "./Header";         // <-- NEW
import RightDrawer from "./RightDrawer"; // <-- NEW

export default function ChatPanel({ userId = "jim_default" }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);  // <-- NEW
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
    <div className="chat-wrapper" style={styles.wrapper}>

      {/* NEW HEADER */}
      <Header onMenuClick={() => setDrawerOpen(true)} />

      {/* RIGHT DRAWER */}
      <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* CHAT SCROLL AREA */}
      <div className="chat-panel" ref={panelRef} style={styles.chatPanel}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "msg user" : "msg cipher"}
            style={m.role === "user" ? styles.userMsg : styles.cipherMsg}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="msg cipher" style={styles.cipherMsg}>
            <em>… Cipher is processing …</em>
          </div>
        )}
      </div>

      {/* INPUT BAR */}
      <InputBar onSend={sendMessage} />

    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "black",
    color: "white",
  },
  chatPanel: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  userMsg: {
    background: "#222",
    padding: "10px 14px",
    borderRadius: "10px",
    marginBottom: "10px",
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  cipherMsg: {
    background: "#111",
    padding: "10px 14px",
    borderRadius: "10px",
    marginBottom: "10px",
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
};
