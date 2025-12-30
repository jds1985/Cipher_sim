import { useEffect, useRef, useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Cipher online. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: [...messages, userMessage],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Chat API error");
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "…" },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ Cipher encountered an error." },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.chat}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "user" ? styles.user : styles.assistant),
            }}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message Cipher…"
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.send}>
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#0b0b12",
  },
  chat: {
    flex: 1,
    padding: 20,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  bubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: 16,
    lineHeight: 1.4,
    fontSize: 15,
  },
  user: {
    alignSelf: "flex-end",
    background: "#5b5bff",
    color: "white",
  },
  assistant: {
    alignSelf: "flex-start",
    background: "#1a1a28",
    color: "#e6e6ff",
  },
  inputRow: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop: "1px solid #1f1f2f",
  },
  input: {
    flex: 1,
    resize: "none",
    borderRadius: 12,
    padding: 12,
    background: "#11111a",
    color: "white",
    border: "1px solid #2a2a3a",
    outline: "none",
  },
  send: {
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "#6f6fff",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
};
