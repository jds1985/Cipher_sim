import { useState, useRef, useEffect } from "react";

const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;
const MAX_REPLY_CHARS = 1200;

export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") {
      return [{ role: "assistant", content: "Cipher online." }];
    }

    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length
        ? parsed.slice(-MEMORY_LIMIT)
        : [{ role: "assistant", content: "Cipher online." }];
    } catch {
      return [{ role: "assistant", content: "Cipher online." }];
    }
  });

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const bottomRef = useRef(null);
  const typingIntervalRef = useRef(null);

  /* ---------------- lifecycle ---------------- */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(messages.slice(-MEMORY_LIMIT))
      );
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  /* ---------------- helpers ---------------- */

  function trimHistory(history) {
    return history.slice(-HISTORY_WINDOW);
  }

  function resetCipher() {
    localStorage.removeItem(MEMORY_KEY);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setTyping(false);
    setMessages([{ role: "assistant", content: "Cipher online." }]);
  }

  /* ---------------- messaging ---------------- */

  async function sendMessage() {
    if (!input.trim() || typing) return;

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];

    setMessages(historySnapshot);
    setInput("");
    setTyping(true);

    // Abort controller for frontend timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: trimHistory(historySnapshot),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      let fullText = String(data.reply ?? "…");

      if (fullText.length > MAX_REPLY_CHARS) {
        fullText =
          fullText.slice(0, MAX_REPLY_CHARS) + "\n\n[…truncated]";
      }

      // clear any existing typing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

      // ensure only one typing bubble
      setMessages((m) => [
        ...m.filter(
          (msg) => !(msg.role === "assistant" && msg.content === "")
        ),
        { role: "assistant", content: "" },
      ]);

      let index = 0;

      typingIntervalRef.current = setInterval(() => {
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
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          setTyping(false);
        }
      }, 20);
    } catch (err) {
      clearTimeout(timeoutId);

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            err.name === "AbortError"
              ? "⚠️ Response timed out."
              : "⚠️ Cipher failed to respond.",
        },
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

  /* ---------------- UI ---------------- */

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        CIPHER
        <button onClick={resetCipher} style={styles.reset}>
          Reset
        </button>
      </div>

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
        <button onClick={sendMessage} style={styles.send} disabled={typing}>
          Send
        </button>
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

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
  reset: {
    marginLeft: 12,
    padding: "4px 10px",
    borderRadius: 8,
    border: "none",
    background: "rgba(255,255,255,0.12)",
    color: "white",
    fontSize: 12,
    cursor: "pointer",
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
