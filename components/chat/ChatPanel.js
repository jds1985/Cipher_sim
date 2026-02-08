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

const SILENCE_THRESHOLD_MS = 30 * 60 * 1000;
const LAST_USER_MESSAGE_KEY = "cipher_last_user_message";
const NOTE_SHOWN_KEY = "cipher_note_shown";
const RETURN_FROM_NOTE_KEY = "cipher_return_from_note";

// Streaming usually makes 25s safe, but keep a hard cap anyway
const API_TIMEOUT_MS = 60000;
const MAX_ERROR_PREVIEW = 280;

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

const RETURN_LINES = ["Hey.", "I’m here.", "Yeah?", "What’s up.", "Hey — I’m still here."];

function getRandomNote() {
  return NOTE_VARIANTS[Math.floor(Math.random() * NOTE_VARIANTS.length)];
}

function clampText(s, max = MAX_ERROR_PREVIEW) {
  const str = String(s ?? "");
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

async function readApiResponse(res) {
  const status = res?.status ?? 0;
  const contentType = res?.headers?.get?.("content-type") || "";

  let raw = "";
  try {
    raw = await res.text();
  } catch {
    raw = "";
  }

  let data = null;
  const looksJson =
    contentType.includes("application/json") ||
    (raw && raw.trim().startsWith("{")) ||
    (raw && raw.trim().startsWith("["));

  if (looksJson && raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  return { ok: Boolean(res?.ok), status, contentType, raw, data };
}

/**
 * Reads SSE stream (data: JSON\n\n).
 * Calls onEvent(obj) for each parsed event.
 */
async function readSSEStream(res, onEvent) {
  const reader = res?.body?.getReader?.();
  if (!reader) throw new Error("Stream: no readable body");

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const idx = buffer.indexOf("\n\n");
      if (idx === -1) break;

      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      // ignore comments/heartbeats
      if (chunk.startsWith(":")) continue;

      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.replace(/^data:\s*/, "");
        let obj = null;
        try {
          obj = JSON.parse(payload);
        } catch {
          continue;
        }
        try {
          onEvent?.(obj);
        } catch {}
      }
    }
  }
}

/* ===============================
   COMPONENT
================================ */
export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") return [{ role: "assistant", content: "Cipher online." }];

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(MEMORY_KEY, JSON.stringify(messages.slice(-MEMORY_LIMIT)));
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
      { role: "assistant", content: RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)] },
    ]);

    sessionStorage.removeItem(RETURN_FROM_NOTE_KEY);
  }, []);

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
      if (rewarded?.ok) {
        setCoinBalance(getCipherCoin());
        setToast(`🪙 +${rewarded.earned} Cipher Coin earned`);
      }
    } catch {}
  }

  async function sendMessage({ forceDecipher = false } = {}) {
    if (sendingRef.current) return;
    if (!input.trim()) return;

    sendingRef.current = true;
    setTyping(true);

    const activeMode = forceDecipher ? "decipher" : "cipher";

    // 🧊 Soft decipher cooldown
    if (activeMode === "decipher") {
      const gate = canUseDecipher();
      if (!gate.allowed) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `${DECIPHER_COOLDOWN_MESSAGE}\n⏳ ${formatRemaining(gate.remainingMs)}`,
          },
        ]);
        setTyping(false);
        sendingRef.current = false;
        return;
      }
    }

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];

    localStorage.setItem(LAST_USER_MESSAGE_KEY, String(Date.now()));
    
    setInput("");

    // Pre-add an empty assistant bubble for streaming to fill
    const assistantIndexRef = { idx: -1 };
    setMessages((m) => {
      const next = [
        ...m,
        userMessage,
        {
          role: activeMode === "decipher" ? "decipher" : "assistant",
          content: activeMode === "decipher" ? "…" : "", // decipher not streamed
          modelUsed: null,
        },
      ];
      assistantIndexRef.idx = next.length - 1;
      return next;
    });

    try {
      const endpoint = activeMode === "decipher" ? "/api/decipher" : "/api/chat";

      const payload =
        activeMode === "decipher"
          ? {
              message: userMessage.content,
              context: historySnapshot.slice(-HISTORY_WINDOW),
            }
          : {
              message: userMessage.content,
              history: historySnapshot.slice(-HISTORY_WINDOW),
              stream: true, // ⭐ enable streaming for /api/chat
            };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // DECIPHER: keep old JSON behavior
      if (activeMode === "decipher") {
        const parsed = await readApiResponse(res);

        if (!parsed.ok) {
          const serverMsg =
            parsed?.data?.reply ||
            parsed?.data?.error ||
            parsed?.data?.message ||
            (parsed.raw ? clampText(parsed.raw) : "");

          throw new Error(
            serverMsg ? `API ${parsed.status}: ${serverMsg}` : `API ${parsed.status}: (no body)`
          );
        }

        const reply = parsed?.data?.reply || parsed?.data?.message || (parsed.raw ? parsed.raw.trim() : "");
        if (!reply) throw new Error(`API ${parsed.status}: empty body`);

        recordDecipherUse();

        setMessages((m) => {
          const next = [...m];
          // overwrite the placeholder bubble we inserted
          const lastIdx = next.length - 1;
          next[lastIdx] = { role: "decipher", content: String(reply ?? "…"), modelUsed: null };
          return next;
        });

        setTyping(false);
        sendingRef.current = false;
        return;
      }

      // CIPHER STREAM MODE (SSE)
      if (!res.ok) {
        const parsed = await readApiResponse(res);
        const serverMsg =
          parsed?.data?.reply ||
          parsed?.data?.error ||
          parsed?.data?.message ||
          (parsed.raw ? clampText(parsed.raw) : "");
        throw new Error(serverMsg ? `API ${parsed.status}: ${serverMsg}` : `API ${parsed.status}: (no body)`);
      }

      let streamed = "";
      let modelUsed = null;

      await readSSEStream(res, (evt) => {
        if (evt?.type === "delta" && typeof evt?.text === "string") {
          streamed += evt.text;

          setMessages((m) => {
            const next = [...m];
            // update last bubble (placeholder)
            const lastIdx = next.length - 1;
            const last = next[lastIdx];
            if (!last) return next;

            next[lastIdx] = {
              ...last,
              content: streamed,
              modelUsed: modelUsed,
            };
            return next;
          });
        }

        if (evt?.type === "done") {
          modelUsed = evt?.model || null;

          setMessages((m) => {
            const next = [...m];
            const lastIdx = next.length - 1;
            const last = next[lastIdx];
            if (!last) return next;

            next[lastIdx] = {
              ...last,
              content: String(evt?.reply ?? streamed ?? ""),
              modelUsed: modelUsed,
            };
            return next;
          });
        }
      });
    } catch (err) {
      console.error("Cipher send failed:", err);

      const msg =
        err?.name === "AbortError"
          ? `Timeout after ${Math.round(API_TIMEOUT_MS / 1000)}s.`
          : clampText(err?.message || "Unknown transport error");

      // overwrite placeholder bubble with error
      setMessages((m) => {
        const next = [...m];
        const lastIdx = next.length - 1;
        next[lastIdx] = { role: "assistant", content: `Transport error: ${msg}`, modelUsed: null };
        return next;
      });
    } finally {
      setTyping(false);
      sendingRef.current = false;
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

      <HeaderMenu title="CIPHER" onOpenDrawer={() => setDrawerOpen(true)} />

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

      <InputBar input={input} setInput={setInput} onSend={sendMessage} typing={typing} />

      {toast && <RewardToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
