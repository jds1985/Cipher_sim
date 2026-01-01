import { useState, useRef, useEffect } from "react";

/* ===============================
   CONFIG
================================ */

const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;
const MAX_REPLY_CHARS = 1200;

// 🔑 Session flag (clears chat on hard refresh / new tab)
const SESSION_FLAG = "cipher_session_active";

// 🆕 Silence detection config
const SILENCE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const LAST_USER_MESSAGE_KEY = "cipher_last_user_message";
const NOTE_SHOWN_KEY = "cipher_note_shown";

/* ===============================
   MAIN COMPONENT
================================ */

export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") {
      return [{ role: "assistant", content: "Cipher online." }];
    }

    try {
      if (!sessionStorage.getItem(SESSION_FLAG)) {
        sessionStorage.setItem(SESSION_FLAG, "true");
        localStorage.removeItem(MEMORY_KEY);
        return [{ role: "assistant", content: "Cipher online." }];
      }

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

  // 🟨 Cipher Note state
  const [cipherNote, setCipherNote] = useState(null);

  const bottomRef = useRef(null);
  const typingIntervalRef = useRef(null);

  /* ===============================
     LIFECYCLE
  ================================ */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // 🧠 Persist ONLY during active session
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem(SESSION_FLAG)
    ) {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(messages.slice(-MEMORY_LIMIT))
      );
    }
  }, [messages]);

  // 🧹 Cleanup typing loop
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  /* ===============================
     🆕 SILENCE DETECTION
  ================================ */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastMessage = localStorage.getItem(LAST_USER_MESSAGE_KEY);
    const noteShown = sessionStorage.getItem(NOTE_SHOWN_KEY);

    if (!lastMessage || noteShown) return;

    const silenceTime = Date.now() - Number(lastMessage);

    if (silenceTime >= SILENCE_THRESHOLD_MS) {
      setCipherNote({
        header: "Cipher noticed some space.",
        message:
          "You went quiet after saying this mattered.\nI’m still holding the thread.",
      });

      sessionStorage.setItem(NOTE_SHOWN_KEY, "true");
    }
  }, []);

  /* ===============================
     HELPERS
  ================================ */

  function trimHistory(history) {
    return history.slice(-HISTORY_WINDOW);
  }

  function resetCipher() {
    localStorage.removeItem(MEMORY_KEY);
    localStorage.removeItem(LAST_USER_MESSAGE_KEY);
    sessionStorage.removeItem(SESSION_FLAG);
    sessionStorage.removeItem(NOTE_SHOWN_KEY);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setTyping(false);
    setCipherNote(null);
    setMessages([{ role: "assistant", content: "Cipher online." }]);
  }

  /* ===============================
     MESSAGING
  ================================ */

  async function sendMessage() {
    if (!input.trim() || typing) return;

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];

    // 🆕 Track last user activity
    if (typeof window !== "undefined") {
      localStorage.setItem(
        LAST_USER_MESSAGE_KEY,
        String(Date.now())
      );
    }

    setMessages(historySnapshot);
    setInput("");
    setTyping(true);

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

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

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

  /* ===============================
     UI
  ================================ */

  return (
    <div style={styles.wrap}>
      {cipherNote && (
        <CipherNote
          note={cipherNote}
          onOpen={() => setCipherNote(null)}
          onDismiss={() => setCipherNote(null)}
        />
      )}

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

/* ===============================
   CIPHER NOTE COMPONENT
================================ */

function CipherNote({ note, onOpen, onDismiss }) {
  return (
    <div style={noteStyles.wrap}>
      <div style={noteStyles.note}>
        <div style={noteStyles.header}>{note.header}</div>
        <div style={noteStyles.body}>{note.message}</div>
        <div style={noteStyles.actions}>
          <button style={noteStyles.primary} onClick={onOpen}>
            Open chat
          </button>
          <button style={noteStyles.secondary} onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
================================ */

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

const noteStyles = {
  wrap: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    pointerEvents: "none",
  },
  note: {
    pointerEvents: "auto",
    position: "absolute",
    top: 90,
    right: 18,
    width: 320,
    padding: 16,
    borderRadius: 14,
    background: "rgba(255, 244, 181, 0.98)",
    color: "#1a1a1a",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    transform: "rotate(-1.5deg)",
  },
  header: {
    fontWeight: 700,
    marginBottom: 8,
  },
  body: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    marginBottom: 14,
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  primary: {
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondary: {
    background: "rgba(255,255,255,0.6)",
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
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
