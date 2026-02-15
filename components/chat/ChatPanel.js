import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

import { getCipherCoin, rewardShare } from "./CipherCoin";

/* ===============================
   CONFIG
================================ */
const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;
const LAST_USER_MESSAGE_KEY = "cipher_last_user_message";

/* ===============================
   SSE PARSER
================================ */
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

      if (chunk.startsWith(":")) continue;

      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.replace(/^data:\s*/, "");
        try {
          onEvent?.(JSON.parse(payload));
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
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed.slice(-MEMORY_LIMIT) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

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
    if (drawerOpen) setCoinBalance(getCipherCoin());
  }, [drawerOpen]);

  function clearChat() {
    try {
      localStorage.removeItem(MEMORY_KEY);
    } catch {}
    setMessages([]);
  }

  /* ===============================
     USER SEND
  ================================= */
  async function sendMessage(opts = {}) {
    if (sendingRef.current) return;

    const text = (input || "").trim();
    if (!text) return;

    sendingRef.current = true;
    setTyping(true);

    const forceDecipher = Boolean(opts?.forceDecipher);

    const userMessage = { role: "user", content: text };
    const historySnapshot = [...messages, userMessage];

    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_USER_MESSAGE_KEY, String(Date.now()));
    }

    setInput("");

    setMessages((m) => [
      ...m,
      userMessage,
      {
        role: forceDecipher ? "decipher" : "assistant",
        content: "",
        modelUsed: null,
        memoryInfluence: [],
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: historySnapshot.slice(-HISTORY_WINDOW),
          stream: true,
          forceDecipher,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      let streamed = "";
      let modelUsed = null;
      let memoryInfluence = [];

      await readSSEStream(res, (evt) => {
        if (evt?.type === "delta" && typeof evt?.text === "string") {
          streamed += evt.text;
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: streamed,
              modelUsed,
              memoryInfluence,
            };
            return next;
          });
        }

        if (evt?.type === "done") {
          modelUsed = evt?.model || null;
          memoryInfluence = evt?.memoryInfluence || [];

          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: streamed,
              modelUsed,
              memoryInfluence,
            };
            return next;
          });
        }
      });
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: forceDecipher ? "decipher" : "assistant",
          content: "Transport error",
          modelUsed: null,
          memoryInfluence: [],
        };
        return next;
      });
    } finally {
      setTyping(false);
      sendingRef.current = false;
    }
  }

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="cipher-wrap">
      <HeaderMenu
        title="CIPHER"
        onOpenDrawer={() => setDrawerOpen(true)}
        onNewChat={clearChat}
      />

      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cipherCoin={coinBalance}
        onInvite={() => {}}
        onOpenStore={() => (window.location.href = "/store")}
      />

      <div className="cipher-chat">
        {/* ⭐ spacer prevents header overlap */}
        <div style={{ height: "12px", flexShrink: 0 }} />
        <MessageList messages={messages} bottomRef={bottomRef} />
      </div>

      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing}
      />
    </div>
  );
}
