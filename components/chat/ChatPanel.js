import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

import { getCipherCoin } from "./CipherCoin";

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
  const [selectedIndex, setSelectedIndex] = useState(null);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

  /* ===============================
     AUTO SCROLL
  ================================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
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
    setSelectedIndex(null);
  }

  /* ===============================
     INLINE TRANSFORM
  ================================= */
  async function runInlineTransform(instruction) {
    if (selectedIndex === null) return;

    const original = messages[selectedIndex];
    if (!original?.content) return;

    const backup = original.content;

    setMessages((m) => {
      const copy = [...m];
      copy[selectedIndex] = { ...copy[selectedIndex], transforming: true };
      return copy;
    });

    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${instruction}\n\n${backup}`,
          history: [],
          stream: false,
        }),
      });

      if (!res.ok) throw new Error("transform failed");

      const data = await res.json();
      const newText = data?.text || data?.content;

      if (!newText) throw new Error("empty response");

      setMessages((m) => {
        const copy = [...m];
        copy[selectedIndex] = {
          ...copy[selectedIndex],
          content: newText,
          transforming: false,
        };
        return copy;
      });
    } catch (err) {
      console.error(err);

      setMessages((m) => {
        const copy = [...m];
        copy[selectedIndex] = {
          ...copy[selectedIndex],
          content: backup,
          transforming: false,
        };
        return copy;
      });
    } finally {
      setTyping(false);
    }
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
    setSelectedIndex(null);

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

      {/* NEW MAIN CONTAINER */}
      <div className="cipher-main">
        <div className="cipher-chat">
          <MessageList
            messages={messages}
            bottomRef={bottomRef}
            onSelectMessage={setSelectedIndex}
            selectedIndex={selectedIndex}
          />
        </div>

       <div style={{ color: "red", padding: 8 }}>
  Selected: {String(selectedIndex)}
</div>
{/* ACTION DOCK */}
        {selectedIndex !== null && (
          <div className="cipher-quick-actions">
            <button onClick={() => runInlineTransform("Analyze this answer:")}>
              Analyze
            </button>
            <button onClick={() => runInlineTransform("Make this shorter:")}>
              Shorter
            </button>
            <button onClick={() => runInlineTransform("Expand this answer:")}>
              Longer
            </button>
            <button onClick={() => runInlineTransform("Summarize this:")}>
              Summarize
            </button>
          </div>
        )}
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
