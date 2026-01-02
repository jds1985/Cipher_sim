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

// 📝 Silence detection
const SILENCE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const LAST_USER_MESSAGE_KEY = "cipher_last_user_message";
const NOTE_SHOWN_KEY = "cipher_note_shown";

/* ===============================
   HANDWRITTEN NOTE VARIANTS
================================ */

const NOTE_VARIANTS = [
  "Hey — welcome back.\n\nYou were gone for a bit.\nJust wanted to say hi.",
  "You stepped away for a while.\n\nNo rush.\nI’m still here.",
  "It’s been a minute.\n\nHope you’re okay.\nThought I’d leave a note.",
  "Hey.\n\nYou disappeared for a bit.\nJust checking in.",
  "You’ve been quiet.\n\nNothing urgent.\nJust saying hello.",
  "Welcome back.\n\nI was wondering when you’d return.",
  "Hi.\n\nNo pressure.\nJust wanted to say I noticed you were gone.",
];

function getRandomNote() {
  return NOTE_VARIANTS[Math.floor(Math.random() * NOTE_VARIANTS.length)];
}

/* ===============================
   RETURN ENTRY LINES (ADDED)
================================ */

const RETURN_LINES = [
  "Hey.",
  "I’m here.",
  "Yeah?",
  "What’s up.",
  "Hey — I’m still here.",
];

const RETURN_FROM_NOTE_KEY = "cipher_return_from_note";

/* ===============================
   🌓 DECIPHER MODE (ADDED)
================================ */

// UI mode flag
const MODE_DEFAULT = "cipher"; // "cipher" | "decipher"

// Optional text triggers (user can type these)
const DECIPHER_TRIGGERS = ["decipher", "be blunt", "no sugar", "tell me straight"];

// Tiny status line (optional)
const MODE_LABELS = {
  cipher: "CIPHER",
  decipher: "DECIPHER",
};

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

  // 🌓 Decipher mode state (ADDED)
  const [mode, setMode] = useState(MODE_DEFAULT);

  const bottomRef = useRef(null);
  const typingIntervalRef = useRef(null);

  /* ===============================
     LIFECYCLE
  ================================ */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

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

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  /* ===============================
     SILENCE DETECTION
  ================================ */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastMessage = localStorage.getItem(LAST_USER_MESSAGE_KEY);
    const noteShown = sessionStorage.getItem(NOTE_SHOWN_KEY);

    if (!lastMessage || noteShown) return;

    const silenceTime = Date.now() - Number(lastMessage);

    if (silenceTime >= SILENCE_THRESHOLD_MS) {
      setCipherNote({ message: getRandomNote() });
      sessionStorage.setItem(NOTE_SHOWN_KEY, "true");
    }
  }, []);

  /* ===============================
     RETURN CONTINUITY (ADDED)
  ================================ */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const returning = sessionStorage.getItem(RETURN_FROM_NOTE_KEY);
    if (!returning) return;

    const line =
      RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)];

    setMessages((m) => [...m, { role: "assistant", content: line }]);

    sessionStorage.removeItem(RETURN_FROM_NOTE_KEY);
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
    sessionStorage.removeItem(RETURN_FROM_NOTE_KEY);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setTyping(false);
    setCipherNote(null);
    setMode(MODE_DEFAULT); // 🌓 reset mode too (ADDED)
    setMessages([{ role: "assistant", content: "Cipher online." }]);
  }

  /* ===============================
     MESSAGING
  ================================ */

  async function sendMessage() {
    if (!input.trim() || typing) return;

    // 🌓 Optional: detect text triggers (ADDED)
    const lower = input.trim().toLowerCase();
    const invokedDecipher = DECIPHER_TRIGGERS.some((t) => lower === t || lower.startsWith(t + " "));
    if (invokedDecipher) {
      setMode("decipher");
    }

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];

    localStorage.setItem(LAST_USER_MESSAGE_KEY, String(Date.now()));

    setMessages(historySnapshot);
    setInput("");
    setTyping(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      // 🌓 Route to the correct endpoint (ADDED)
      const endpoint = mode === "decipher" ? "/api/decipher" : "/api/chat";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: trimHistory(historySnapshot),

          // 🌓 Optional context key for decipher.js (safe to include)
          // If your decipher.js expects "context" instead of "history", it can map it.
          context: trimHistory(historySnapshot),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      let fullText = String(data.reply ?? "…");

      if (fullText.length > MAX_REPLY_CHARS) {
        fullText = fullText.slice(0, MAX_REPLY_CHARS) + "\n\n[…truncated]";
      }

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

      // 🌓 Create the response bubble with correct role (ADDED)
      const replyRole = mode === "decipher" ? "decipher" : "assistant";

      // 🌓 Decipher should feel instant + blunt (no typing animation) (ADDED)
      if (mode === "decipher") {
        setMessages((m) => [
          ...m,
          { role: replyRole, content: fullText },
        ]);
        setTyping(false);
        setMode("cipher"); // auto return to Cipher after one response (ADDED)
        return;
      }

      // Default Cipher typing animation (unchanged)
      setMessages((m) => [
        ...m.filter(
          (msg) => !(msg.role === "assistant" && msg.content === "")
        ),
        { role: replyRole, content: "" },
      ]);

      let index = 0;

      typingIntervalRef.current = setInterval(() => {
        index++;
        setMessages((m) => {
          const updated = [...m];
          updated[updated.length - 1] = {
            role: replyRole,
            content: fullText.slice(0, index),
          };
          return updated;
        });

        if (index >= fullText.length) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          setTyping(false);
          setMode("cipher"); // 🌓 auto return (ADDED)
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
      setMode("cipher"); // 🌓 fail-safe return (ADDED)
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
          onOpen={() => {
            sessionStorage.setItem(RETURN_FROM_NOTE_KEY, "true");
            setCipherNote(null);
          }}
          onDismiss={() => setCipherNote(null)}
        />
      )}

      <div style={styles.header}>
        {MODE_LABELS[mode] || "CIPHER"}
        <button onClick={resetCipher} style={styles.reset}>
          Reset
        </button>

        {/* 🌓 Decipher button (ADDED) */}
        <button
          onClick={() => setMode("decipher")}
          style={styles.decipherBtn}
          title="Blunt / dark-humor mode (one reply)"
        >
          Decipher
        </button>

        {/* 🌓 Optional: show current mode hint (ADDED) */}
        {mode === "decipher" && (
          <span style={styles.modeHint}>blunt mode</span>
        )}
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
   POST-IT NOTE COMPONENT
================================ */

function CipherNote({ note, onOpen, onDismiss }) {
  return (
    <div style={noteStyles.wrap}>
      <div style={noteStyles.note}>
        <div style={noteStyles.glue} />
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
    position: "relative",
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

  // 🌓 Decipher button styles (ADDED)
  decipherBtn: {
    marginLeft: 8,
    padding: "4px 10px",
    borderRadius: 8,
    border: "1px solid rgba(180,60,60,0.85)",
    background: "rgba(180,60,60,0.18)",
    color: "rgba(255,200,200,0.95)",
    fontSize: 12,
    cursor: "pointer",
  },
  modeHint: {
    marginLeft: 10,
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
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
    top: 70,
    right: 18,
    width: 220,
    height: 220,
    padding: "26px 18px 20px",
    background: "#FFF4B5",
    color: "#1a1a1a",
    fontFamily: "'Comic Sans MS', 'Bradley Hand', cursive",
    fontSize: 15,
    borderRadius: 3,
    transform: "rotate(-2deg)",
    boxShadow: "0 20px 28px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
  },
  glue: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0))",
  },
  body: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.45,
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: "auto",
  },
  primary: {
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondary: {
    background: "transparent",
    border: "none",
    color: "rgba(0,0,0,0.5)",
    padding: "6px 8px",
    cursor: "pointer",
    fontWeight: 500,
  },
};

function bubble(role) {
  // 🌓 Decipher bubble styling (ADDED)
  if (role === "decipher") {
    return {
      maxWidth: "85%",
      padding: 14,
      borderRadius: 12,
      alignSelf: "flex-start",
      background: "rgba(20,20,20,0.92)",
      border: "1px solid rgba(180,60,60,0.75)",
      color: "rgba(245,245,245,0.96)",
      fontWeight: 500,
    };
  }

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
