import { useState, useRef, useEffect } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") {
      return [{ role: "assistant", content: "Cipher online." }];
    }
    const saved = localStorage.getItem("cipher_memory");
    return saved
      ? JSON.parse(saved)
      : [{ role: "assistant", content: "Cipher online." }];
  });

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // persist memory
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cipher_memory", JSON.stringify(messages));
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || typing) return;

    const userMessage = { role: "user", content: input };

    setMessages((m) => [...m, userMessage]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: [...messages, userMessage],
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const fullText = data.reply || "…";

      // create empty assistant bubble
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      let index = 0;
      const interval = setInterval(() => {
        index++;

        setMessages((m) => {
          const updated = [...m];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText.slice(0, index),
          };
          return updated;
        });

        if (index >= fullText.length) {
          clearInterval(interval);
          setTyping(false);
        }
      }, 20);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "⚠️ Cipher failed to respond." },
      ]);
      setTyping(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>CIPHER</div>

      <div style={styles.chat}>
        {messages.map((m, i) => (
          <div key={i} style={bubble(m.role)}>
            {m.content || "…"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Talk to Cipher…"
          style={styles.input}
          disabled={typing}
        />
        <button
          onClick={sendMessage}
          style={styles.send}
          disabled={typing}
        >
          Send
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
    background: "radial-gradient(circle at top, #0a0f2a, #05050b)",
    color: "white",
  },
  header: {
    padding: 20,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
    textAlign: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  chat: {
    flex: 1,
    padding: 20,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  inputRow: {
    display: "flex",
    gap: 12,
    padding: 16,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    resize: "none",
  },
  send: {
    padding: "0 18px",
    borderRadius: 14,
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    border: "none",
    color: "white",
    fontWeight: 700,
    opacity: 1,
  },
};

function bubble(role) {
  return {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 18,
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background:
      role === "user"
        ? "linear-gradient(135deg,#3a4bff,#6b7cff)"
        : "rgba(255,255,255,0.08)",
  };
}
