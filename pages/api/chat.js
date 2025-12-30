import { useEffect, useRef, useState } from "react";

export default function CipherChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Cipher online. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: next,
        }),
      });

      const data = await res.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "…" },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "⚠️ I had trouble responding. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.chat}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "user" ? styles.user : styles.cipher),
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.bubble, ...styles.cipher, opacity: 0.6 }}>
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputBar}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message Cipher…"
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.send}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#0b0b12",
    color: "white",
  },
  chat: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  bubble: {
    maxWidth: "75%",
    padding: "12px 14px",
    borderRadius: 16,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },
  user: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #6b5cff, #8a7bff)",
  },
  cipher: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  inputBar: {
    display: "flex",
    gap: 10,
    padding: 12,
    borderTop: "1px solid rgba(255,255,255,0.12)",
    background: "#0f0f18",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    resize: "vertical",
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "#08080d",
    color: "white",
    outline: "none",
  },
  send: {
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    background: "#6b5cff",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
};
