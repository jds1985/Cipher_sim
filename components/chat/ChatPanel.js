import { useState, useRef, useEffect } from "react";

/* ===============================
   CONFIG
================================ */

const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;
const MAX_REPLY_CHARS = 1200;

const SESSION_FLAG = "cipher_session_active";

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
  const [cipherNote, setCipherNote] = useState(null);

  const bottomRef = useRef(null);
  const typingIntervalRef = useRef(null);

  /* ===============================
     LIFECYCLE
  ================================ */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(messages.slice(-MEMORY_LIMIT))
      );
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  /* ===============================
     SILENCE DETECTION
  ================================ */

  useEffect(() => {
    const lastMessage = localStorage.getItem(LAST_USER_MESSAGE_KEY);
    const noteShown = sessionStorage.getItem(NOTE_SHOWN_KEY);

    if (!lastMessage || noteShown) return;

    if (Date.now() - Number(lastMessage) >= SILENCE_THRESHOLD_MS) {
      setCipherNote({
        header: "Hey — welcome back.",
        message: "You were gone for a bit.\nJust wanted to say hi.",
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
    sessionStorage.clear();

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

    localStorage.setItem(LAST_USER_MESSAGE_KEY, String(Date.now()));

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];

    setMessages(historySnapshot);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: trimHistory(historySnapshot),
        }),
      });

      const data = await res.json();
      const fullText = String(data.reply ?? "…");

      setMessages((m) => [...m, { role: "assistant", content: fullText }]);
      setTyping(false);
    } catch {
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
            {m.content}
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
   CIPHER NOTE
================================ */

function CipherNote({ note, onOpen, onDismiss }) {
  return (
    <div style={noteStyles.wrap}>
      <div style={noteStyles.note}>
        <div style={noteStyles.glue} />
        <div style={noteStyles.curl} />
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
  },
  reset: {
    marginLeft: 12,
    padding: "4px 10px",
    borderRadius: 8,
    border: "none",
    background: "rgba(255,255,255,0.12)",
    color: "white",
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
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    color: "white",
  },
  send: {
    borderRadius: 14,
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    color: "white",
    fontWeight: 700,
    padding: "0 18px",
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
    top: 70,
    right: 18,
    width: 210,
    height: 210,
    padding: "28px 16px 18px",
    background: "#FFF4B5",
    borderRadius: 2,
    transform: "rotate(-2deg)",
    boxShadow: "0 18px 28px rgba(0,0,0,0.35)",
    fontFamily: "'Patrick Hand', cursive",
  },
  glue: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0))",
  },
  curl: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 22,
    height: 22,
    background: "#F3E89E",
    transform: "rotate(12deg)",
    boxShadow: "-2px -2px 6px rgba(0,0,0,0.15)",
  },
  header: {
    fontSize: 18,
    marginBottom: 8,
  },
  body: {
    fontSize: 17,
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
  },
  actions: {
    position: "absolute",
    bottom: 10,
    right: 10,
    display: "flex",
    gap: 8,
  },
  primary: {
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "4px 8px",
  },
  secondary: {
    background: "transparent",
    border: "none",
    color: "rgba(0,0,0,0.5)",
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
