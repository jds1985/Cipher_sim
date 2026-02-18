import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import QuickActions from "./QuickActions";

import { getCipherCoin } from "./CipherCoin";

/* ===============================
   CONFIG
================================ */
const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;

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
  const [showMemory, setShowMemory] = useState(false);

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
    setShowMemory(false);
  }

  function handleSelectMessage(i, options = {}) {
    setSelectedIndex(i);
    setShowMemory(!!options.openMemory);
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

      const newText =
        data?.reply ||
        data?.text ||
        data?.content ||
        data?.message ||
        null;

      if (!newText) throw new Error("empty response");

      setMessages((m) => {
        const copy = [...m];
        copy[selectedIndex] = {
          ...copy[selectedIndex],
          content: newText,
          transforming: false,
          modelUsed: data?.model || null,
          memoryInfluence: data?.memoryInfluence || [],
        };
        return copy;
      });
    } catch {
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
  async function sendMessage() {
    if (sendingRef.current) return;

    const text = (input || "").trim();
    if (!text) return;

    sendingRef.current = true;
    setTyping(true);

    const userMessage = { role: "user", content: text };
    const historySnapshot = [...messages, userMessage];

    setInput("");
    setSelectedIndex(null);
    setShowMemory(false);

    setMessages((m) => [
      ...m,
      userMessage,
      {
        role: "assistant",
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
          role: "assistant",
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
  ================================= */
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
      />

      <div className="cipher-main">
        <div className="cipher-chat">
          <MessageList
            messages={messages}
            bottomRef={bottomRef}
            onSelectMessage={handleSelectMessage}
            selectedIndex={selectedIndex}
          />
        </div>
      </div>

      {/* MEMORY OVERLAY */}
      {showMemory && selectedIndex !== null && (
        <div
          className="cipher-memory-overlay"
          onClick={() => setShowMemory(false)}
        >
          <div
            className="cipher-memory-panel slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cipher-memory-header">
              <div>Memory Used</div>
              <button
                className="cipher-memory-close"
                onClick={() => setShowMemory(false)}
              >
                ✕
              </button>
            </div>

            {messages[selectedIndex]?.memoryInfluence?.length > 0 ? (
              messages[selectedIndex].memoryInfluence.map((mem, i) => (
                <div key={i} className="cipher-memory-card">
                  <div className="cipher-memory-type">{mem.type}</div>
                  <div className="cipher-memory-preview">
                    {mem.preview}
                  </div>
                  <div className="cipher-memory-score">
                    score: {mem.score}
                  </div>
                </div>
              ))
            ) : (
              <div className="cipher-memory-empty">
                No memory used.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedIndex !== null && (
        <QuickActions onAction={runInlineTransform} />
      )}

      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing}
      />
    </div>
  );
}
