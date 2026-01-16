// components/chat/ChatPanel.js
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

import { getCipherCoin, rewardShare } from "./CipherCoin";

/* ===============================
   CONFIG
================================ */
const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;

// Silence detection
const SILENCE_THRESHOLD_MS = 30 * 60 * 1000;
const LAST_USER_MESSAGE_KEY = "cipher_last_user_message";
const NOTE_SHOWN_KEY = "cipher_note_shown";
const RETURN_FROM_NOTE_KEY = "cipher_return_from_note";

/* ===============================
   NOTES
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

const RETURN_LINES = [
  "Hey.",
  "I’m here.",
  "Yeah?",
  "What’s up.",
  "Hey — I’m still here.",
];

function getRandomNote() {
  return NOTE_VARIANTS[Math.floor(Math.random() * NOTE_VARIANTS.length)];
}

/* ===============================
   COMPONENT
================================ */
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
  const [cipherNote, setCipherNote] = useState(null);

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
    if (typeof window === "undefined") return;
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(messages.slice(-MEMORY_LIMIT))
    );
  }, [messages]);

  useEffect(() => {
    if (!drawerOpen) return;
    setCoinBalance(getCipherCoin());
  }, [drawerOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastMessage = localStorage.getItem(LAST_USER_MESSAGE_KEY);
    const noteShown = sessionStorage.getItem(NOTE_SHOWN_KEY);
    if (!lastMessage || noteShown) return;

    if (Date.now() - Number(lastMessage) >= SILENCE_THRESHOLD_MS) {
      setCipherNote({ message: getRandomNote() });
      sessionStorage.setItem(NOTE_SHOWN_KEY, "true");
    }
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem(RETURN_FROM_NOTE_KEY)) return;

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content:
          RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)],
      },
    ]);

    sessionStorage.removeItem(RETURN_FROM_NOTE_KEY);
  }, []);

  /* ===============================
     INVITE / SHARE  ✅ FIXED
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
        setToast("🔗 Link copied — share it anywhere");
      }

      const rewarded = rewardShare();
      if (rewarded.ok) {
        setCoinBalance(getCipherCoin());
        setToast(`🪙 +${rewarded.earned} Cipher Coin earned`);
      }
    } catch {
      // user cancelled — ignore
    }
  }

  /* ===============================
     SEND MESSAGE — FINAL
  ================================ */
  async function sendMessage({ forceDecipher = false } = {}) {
    if (sendingRef.current) return;
    if (!input.trim()) return;

    sendingRef.current = true;

    let activeMode = forceDecipher ? "decipher" : "cipher";

    if (activeMode === "decipher") {
      const gate = canUseDecipher();
      if (!gate.allowed) {
        setMessages((m) => [
          ...m,
          {
            role: "decipher",
            content:
              `${DECIPHER_COOLDOWN_MESSAGE}\n\n` +
              `⏳ Cooldown remaining: ${formatRemaining(
                gate.remainingMs
              )}`,
          },
        ]);
        sendingRef.current = false;
        return;
      }
    }

    setTyping(true);

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];

    localStorage.setItem(
      LAST_USER_MESSAGE_KEY,
      String(Date.now())
    );

    setMessages(historySnapshot);
    setInput("");

    try {
      const endpoint =
        activeMode === "decipher" ? "/api/decipher" : "/api/chat";

      const payload =
        activeMode === "decipher"
          ? {
              message: userMessage.content,
              context: historySnapshot.slice(-HISTORY_WINDOW),
            }
          : {
              message: userMessage.content,
              history: historySnapshot.slice(-HISTORY_WINDOW),
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (activeMode === "decipher") {
        recordDecipherUse();
      }

      setMessages((m) => [
        ...m,
        {
          role:
            activeMode === "decipher"
              ? "decipher"
              : "assistant",
          content: String(data.reply ?? "…"),
        },
      ]);
    } finally {
      setTyping(false);
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
            sessionStorage.setItem(
              RETURN_FROM_NOTE_KEY,
              "true"
            );
            setCipherNote(null);
          }}
          onDismiss={() => setCipherNote(null)}
        />
      )}

      <HeaderMenu
        title="CIPHER"
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cipherCoin={coinBalance}
        onInvite={handleInvite}
        onOpenStore={() => (window.location.href = "/store")}
      />

      <div style={styles.chat}>
        <MessageList
          messages={messages}
          bottomRef={bottomRef}
        />
      </div>

      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing}
      />

      {toast && (
        <RewardToast
          message={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
