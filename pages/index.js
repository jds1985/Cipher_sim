// /pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ---------- helpers ----------
  const toMillis = (ts) => {
    if (!ts) return 0;
    // Firestore Timestamp?
    if (typeof ts?.toMillis === "function") return ts.toMillis();
    // Already a number or ISO?
    if (typeof ts === "number") return ts;
    const n = Number(ts);
    if (!Number.isNaN(n)) return n;
    try { return Date.parse(ts) || 0; } catch { return 0; }
  };

  const sortByTime = (arr) =>
    [...arr].sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ---------- load memory ----------
  const loadMessages = async () => {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      if (Array.isArray(data?.messages)) {
        setMessages(sortByTime(data.messages));
      }
    } catch (err) {
      console.error("memory load error:", err);
    }
  };

  useEffect(() => { loadMessages(); }, []);
  useEffect(() => {
    const onFocus = () => loadMessages();
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(scrollToBottom, [messages]);

  // ---------- send ----------
  const sendMessage = async () => {
    const text = message.trim();
    if (!text || loading) return;

    // optimistic UI
    const now = Date.now();
    const optimisticUser = { role: "user", text, timestamp: now };
    const optimisticAI   = { role: "cipher", text: "(…)", timestamp: now + 1 };

    setMessages((prev) => sortByTime([...prev, optimisticUser, optimisticAI]));
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      // Replace the last placeholder with the real reply by just reloading canonical history
      await loadMessages();

      // Fallback: if API didn’t return messages in time, update the last bubble
      if (!Array.isArray(data?.messages) && data?.reply) {
        setMessages((prev) => {
          const cp = [...prev];
          for (let i = cp.length - 1; i >= 0; i--) {
            if (cp[i].role === "cipher" && cp[i].text === "(…)") {
              cp[i] = { ...cp[i], text: data.reply, timestamp: Date.now() };
              break;
            }
          }
          return sortByTime(cp);
        });
      }
    } catch (err) {
      console.error("send error:", err);
      // show an inline error bubble
      setMessages((prev) =>
        sortByTime([
          ...prev.filter((m) => !(m.role === "cipher" && m.text === "(…)")),
          { role: "cipher", text: "Sorry—something went wrong. Try again.", timestamp: Date.now() },
        ])
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ---------- styles ----------
  const wrap = {
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    background: "#ffffff",
    color: "#0b0b0b",
    display: "flex",
    flexDirection: "column",
  };

  const header = {
    padding: "18px 16px",
    textAlign: "center",
    fontWeight: 800,
    fontSize: "28px",
    letterSpacing: 0.3,
    borderBottom: "1px solid #eee",
    color: "#111",
  };

  const chat = {
    flex: 1,
    maxWidth: 820,
    width: "100%",
    margin: "0 auto",
    padding: "20px 14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const bubbleBase = {
    maxWidth: "84%",
    padding: "12px 14px",
    borderRadius: 18,
    lineHeight: 1.45,
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
    boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
    fontSize: 16,
  };

  const bubbleAI = {
    ...bubbleBase,
    alignSelf: "flex-start",
    background: "#f2f2f7",         // light gray
    color: "#111",
  };

  const bubbleUser = {
    ...bubbleBase,
    alignSelf: "flex-end",
    background: "#1e60ff",         // blue
    color: "#fff",
  };

  const composerWrap = {
    position: "sticky",
    bottom: 0,
    borderTop: "1px solid #eee",
    background: "#fff",
  };

  const composer = {
    display: "flex",
    gap: 8,
    maxWidth: 820,
    width: "100%",
    margin: "0 auto",
    padding: 12,
  };

  const input = {
    flex: 1,
    resize: "none",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #ddd",
    outline: "none",
    background: "#fff",
    fontSize: 16,
  };

  const sendBtn = {
    minWidth: 92,
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: loading ? "#8aa6ff" : "#1e60ff",
    color: "#fff",
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
  };

  // ---------- render ----------
  return (
    <main style={wrap}>
      <div style={header}>Cipher AI</div>

      <section style={chat}>
        {messages.map((m, i) => (
          <div
            key={`${i}-${toMillis(m.timestamp)}`}
            style={m.role === "user" ? bubbleUser : bubbleAI}
          >
            {m.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </section>

      <div style={composerWrap}>
        <div style={composer}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type to Cipher…"
            style={input}
          />
          <button onClick={sendMessage} disabled={loading} style={sendBtn}>
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </main>
  );
}
