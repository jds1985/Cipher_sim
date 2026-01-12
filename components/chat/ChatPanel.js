import { useState, useRef, useEffect } from "react";
import { styles } from "./ChatStyles";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import CipherNote from "./CipherNote";
import RewardToast from "./RewardToast";

import {
  canUseDecipher,
  recordDecipherUse,
  DECIPHER_COOLDOWN_MESSAGE,
  formatRemaining,
} from "./decipherCooldown";

import {
  getCipherCoin,
  rewardShare,
  rewardDaily,
} from "./CipherCoin";

/* ===============================
   CONFIG
================================ */

const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;

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
  const [mode, setMode] = useState(MODE_DEFAULT);
  const [decipherRemaining, setDecipherRemaining] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

  /* ===============================
     EFFECTS
  ================================ */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_FLAG)) {
      localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(messages.slice(-MEMORY_LIMIT))
      );
    }
  }, [messages]);

  // Load coin balance when drawer opens
  useEffect(() => {
    if (typeof window === "undefined") return;
    setCoinBalance(getCipherCoin());
  }, [drawerOpen]);

  // ✅ DAILY LOGIN REWARD
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (rewardDaily()) {
      setCoinBalance(getCipherCoin());
      setToast("🪙 +1 Daily Cipher Coin");
    }
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

  /* ===============================
     INVITE / SHARE HANDLER
  ================================ */

  async function handleInvite() {
    const url = `${window.location.origin}?ref=cipher`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Cipher",
          text: "Try Cipher — an AI that actually remembers.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }

      if (rewardShare()) {
        setCoinBalance(getCipherCoin());
        setToast("🪙 +2 Cipher Coin earned");
      }
    } catch {
      // user cancelled — no reward
    }
  }

  /* ===============================
     SEND MESSAGE
  ================================ */

  async function sendMessage() {
    if (sendingRef.current) return;
    if (!input.trim() || typing) return;

    sendingRef.current = true;
    let activeMode = mode;

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
            content: `${DECIPHER_COOLDOWN_MESSAGE}\n\nTry again in ${formatRemaining(
              gate.remainingMs
            )}.`,
          },
        ]);
        setMode("cipher");
        setDecipherRemaining(gate.remainingMs);
        sendingRef.current = false;
        return;
      }
    }

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];
    localStorage.setItem(LAST_USER_MESSAGE_KEY, String(Date.now()));

    setMessages(historySnapshot);
    setInput("");
    setTyping(true);

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
      });

      const data = await res.json();
      const fullText = String(data.reply ?? "…");

      if (activeMode === "decipher") {
        recordDecipherUse();
      }

      setMessages((m) => [
        ...m,
        { role: activeMode === "decipher" ? "decipher" : "assistant", content: fullText },
      ]);
    } finally {
      setTyping(false);
      setMode("cipher");
      sendingRef.current = false;
    }
  }

  /* ===============================
     RENDER
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

      <HeaderMenu
        title={MODE_LABELS[mode] || "CIPHER"}
        onOpenDrawer={() => setDrawerOpen(true)}
        onDecipher={() => setMode("decipher")}
        decipherRemaining={decipherRemaining}
      />

      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cipherCoin={coinBalance}
        onInvite={handleInvite}
        onOpenStore={() => (window.location.href = "/store")}
      />

      <div style={styles.chat}>
        <MessageList messages={messages} bottomRef={bottomRef} />
      </div>

      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing}
      />

      {toast && <RewardToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
