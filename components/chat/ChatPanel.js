import { useState, useRef, useEffect } from "react";
import { styles } from "./ChatStyles";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import RewardToast from "./RewardToast";
import QuickActions from "./QuickActions";

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
    if (typeof window === "undefined")
      return [{ role: "assistant", content: "Cipher online." }];
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const [pulse, setPulse] = useState(false);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

  /* ===============================
     🎧 AUDIO ENGINE
  ================================= */
  const audioRef = useRef(null);

  async function playVoice(text) {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Voice failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
    } catch (err) {
      console.error("playback error:", err);
    }
  }

  /* =============================== */

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

  /* ===============================
     QUICK ACTIONS (REAL TOOLS)
  ================================= */
  async function handleQuickAction(action) {
    if (sendingRef.current) return;

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role !== "user");

    if (!lastAssistant?.content) return;

    let instruction = "";

    switch (action) {
      case "summarize":
        instruction = "Summarize this clearly:\n\n";
        break;
      case "improve":
        instruction = "Improve the quality and clarity of this:\n\n";
        break;
      case "longer":
        instruction = "Expand this with more depth and detail:\n\n";
        break;
      case "shorter":
        instruction = "Make this shorter but keep the meaning:\n\n";
        break;
      case "analyze":
        instruction = "Analyze this carefully:\n\n";
        break;
      case "explain_code":
        instruction = "Explain this code step by step:\n\n";
        break;
      default:
        return;
    }

    sendingRef.current = true;
    setTyping(true);

    // create ONLY assistant bubble
    setMessages((m) => [
      ...m,
      { role: "assistant", content: "", modelUsed: null, memoryInfluence: [] },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: instruction + lastAssistant.content,
          history: messages.slice(-HISTORY_WINDOW),
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
          content: "Tool execution failed",
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
        setToast("Link copied — share it anywhere");
      }

      const rewarded = rewardShare();
      if (rewarded?.ok) {
        setCoinBalance(getCipherCoin());
        setToast(`+${rewarded.earned} Cipher Coin earned`);
      }
    } catch {}
  }

  /* ===============================
     NORMAL USER SEND
  ================================= */
  async function sendMessage() {
    if (sendingRef.current) return;
    if (!input.trim()) return;

    sendingRef.current = true;
    setTyping(true);

    setPulse(true);
    setTimeout(() => setPulse(false), 450);

    const userMessage = { role: "user", content: input };
    const historySnapshot = [...messages, userMessage];

    localStorage.setItem(LAST_USER_MESSAGE_KEY, String(Date.now()));
    setInput("");

    setMessages((m) => [
      ...m,
      userMessage,
      { role: "assistant", content: "", modelUsed: null, memoryInfluence: [] },
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

  return (
    <div style={styles.wrap}>
      <HeaderMenu title="CIPHER" onOpenDrawer={() => setDrawerOpen(true)} />

      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cipherCoin={coinBalance}
        onInvite={handleInvite}
        onOpenStore={() => (window.location.href = "/store")}
      />

      <div
        style={{
          ...styles.chat,
          boxShadow: pulse
            ? "0 0 40px rgba(140,100,255,0.25) inset"
            : "none",
          transition: "box-shadow 0.45s ease",
        }}
      >
        <MessageList
          messages={messages}
          bottomRef={bottomRef}
          onPlayVoice={playVoice}
        />
      </div>

      <QuickActions onSelect={handleQuickAction} />
      <InputBar
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        typing={typing}
      />

      {toast && (
        <RewardToast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
