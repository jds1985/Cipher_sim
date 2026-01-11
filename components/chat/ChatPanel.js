// components/chat/ChatPanel.js
import { useState, useRef, useEffect } from "react";
import { styles } from "./ChatStyles";
import HeaderMenu from "./HeaderMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import CipherNote from "./CipherNote";

import {
  canUseDecipher,
  recordDecipherUse,
  DECIPHER_COOLDOWN_MESSAGE,
  formatRemaining,
  DECIPHER_LAST_KEY,
  DECIPHER_BURST_KEY,
} from "./decipherCooldown";

/* ===============================
   CONFIG
================================ */

const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;
const MAX_REPLY_CHARS = 1200;

const SESSION_FLAG = "cipher_session_active";

// Silence detection
const SILENCE_THRESHOLD_MS = 30 * 60 * 1000;
const LAST_USER_MESSAGE_KEY = "cipher_last_user_message";
const NOTE_SHOWN_KEY = "cipher_note_shown";

// Notes
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

const RETURN_LINES = ["Hey.", "I’m here.", "Yeah?", "What’s up.", "Hey — I’m still here."];
const RETURN_FROM_NOTE_KEY = "cipher_return_from_note";

// Modes
const MODE_DEFAULT = "cipher";
const DECIPHER_TRIGGERS = ["decipher", "be blunt", "no sugar", "tell me straight"];
const MODE_LABELS = { cipher: "CIPHER", decipher: "DECIPHER" };

export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") return [{ role: "assistant", content: "Cipher online." }];

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
  const [mode, setMode] = useState(MODE_DEFAULT);
  const [decipherRemaining, setDecipherRemaining] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const bottomRef = useRef(null);
  const typingIntervalRef = useRef(null);

  /* ===============================
     EFFECTS
  ================================ */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_FLAG)) {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(messages.slice(-MEMORY_LIMIT)));
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const returning = sessionStorage.getItem(RETURN_FROM_NOTE_KEY);
    if (!returning) return;

    const line = RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)];
    setMessages((m) => [...m, { role: "assistant", content: line }]);
    sessionStorage.removeItem(RETURN_FROM_NOTE_KEY);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = setInterval(() => {
      const check = canUseDecipher();
      const remaining = check.allowed ? 0 : check.remainingMs;
      setDecipherRemaining(remaining);

      if (remaining > 0) {
        setMode((m) => (m === "decipher" ? "cipher" : m));
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  function trimHistory(history) {
    return history.slice(-HISTORY_WINDOW);
  }

  function resetCipher() {
    localStorage.removeItem(MEMORY_KEY);
    localStorage.removeItem(LAST_USER_MESSAGE_KEY);
    sessionStorage.removeItem(SESSION_FLAG);
    sessionStorage.removeItem(NOTE_SHOWN_KEY);
    sessionStorage.removeItem(RETURN_FROM_NOTE_KEY);
    localStorage.removeItem(DECIPHER_LAST_KEY);
    localStorage.removeItem(DECIPHER_BURST_KEY);

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    setTyping(false);
    setCipherNote(null);
    setMenuOpen(false);
    setMode(MODE_DEFAULT);
    setDecipherRemaining(0);
    setMessages([{ role: "assistant", content: "Cipher online." }]);
  }

  /* ===============================
     SEND MESSAGE (FIXED)
  ================================ */

  async function sendMessage() {
    if (!input.trim() || typing) return;

    let activeMode = mode;
    let didReceiveReply = false;

    const lower = input.trim().toLowerCase();
    if (DECIPHER_TRIGGERS.some((t) => lower === t || lower.startsWith(t + " "))) {
      activeMode = "decipher";
      setMode("decipher");
    }

    if (activeMode === "decipher") {
      const gate = canUseDecipher();
      if (!gate.allowed) {
        setMessages((m) => [
          ...m,
          {
            role: "decipher",
            content:
              `${DECIPHER_COOLDOWN_MESSAGE}\n\nTry again in ${formatRemaining(gate.remainingMs)}.`,
          },
        ]);
        setMode("cipher");
        setDecipherRemaining(gate.remainingMs);
        return;
      }
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
      const endpoint = activeMode === "decipher" ? "/api/decipher" : "/api/chat";
      const payload =
        activeMode === "decipher"
          ? { message: userMessage.content, context: trimHistory(historySnapshot) }
          : { message: userMessage.content, history: trimHistory(historySnapshot) };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      let fullText = String(data.reply ?? "…");
      if (fullText.length > MAX_REPLY_CHARS) {
        fullText = fullText.slice(0, MAX_REPLY_CHARS) + "\n\n[…truncated]";
      }

      didReceiveReply = true;

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      const replyRole = activeMode === "decipher" ? "decipher" : "assistant";

      if (activeMode === "decipher") {
        recordDecipherUse();
        setMessages((m) => [...m, { role: replyRole, content: fullText }]);
        setTyping(false);
        setMode("cipher");
        return;
      }

      setMessages((m) => [...m, { role: replyRole, content: "" }]);

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
          setTyping(false);
          setMode("cipher");
        }
      }, 20);
    } catch (err) {
      clearTimeout(timeoutId);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      if (didReceiveReply) return; // 🔒 KEY FIX

      setMessages((m) => [
        ...m,
        {
          role: activeMode === "decipher" ? "decipher" : "assistant",
          content:
            err?.name === "AbortError"
              ? "⚠️ Response timed out."
              : "⚠️ Cipher failed to respond.",
        },
      ]);
      setTyping(false);
      setMode("cipher");
    }
  }

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

      <HeaderMenu
        title={MODE_LABELS[mode] || "CIPHER"}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onReset={resetCipher}
        onDecipher={() => setMode("decipher")}
        decipherRemaining={decipherRemaining}
      />

      <div style={styles.chat}>
        <MessageList messages={messages} bottomRef={bottomRef} />
      </div>

      <InputBar input={input} setInput={setInput} onSend={sendMessage} typing={typing} />
    </div>
  );
}
