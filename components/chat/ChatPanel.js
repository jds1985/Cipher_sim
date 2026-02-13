import { useState, useRef, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import DrawerMenu from "./DrawerMenu";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import RewardToast from "./RewardToast";
import QuickActions from "./QuickActions";

import { getCipherCoin, rewardShare } from "./CipherCoin";

const MEMORY_KEY = "cipher_memory";
const MEMORY_LIMIT = 50;
const HISTORY_WINDOW = 12;

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false);

  /* ===============================
     LOAD MEMORY
  =============================== */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) setMessages(JSON.parse(saved).slice(-MEMORY_LIMIT));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(messages.slice(-MEMORY_LIMIT))
    );
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (drawerOpen) setCoinBalance(getCipherCoin());
  }, [drawerOpen]);

  /* ===============================
     QUICK ACTIONS (TEMP SAFE)
  =============================== */
  function handleQuickAction() {
    setToast("Quick actions coming next");
  }

  /* ===============================
     INVITE
  =============================== */
  async function handleInvite() {
    const rewarded = rewardShare();
    if (rewarded?.ok) {
      setCoinBalance(getCipherCoin());
      setToast(`+${rewarded.earned} Cipher Coin earned`);
    }
  }

  /* ===============================
     SEND MESSAGE (SAFE VERSION)
  =============================== */
  async function sendMessage() {
    if (sendingRef.current) return;
    if (!input.trim()) return;

    sendingRef.current = true;
    setTyping(true);

    const userMessage = { role: "user", content: input };
    setInput("");

    setMessages((m) => [
      ...m,
      userMessage,
      { role: "assistant", content: "Thinking...", modelUsed: null },
    ]);

    // Temporary placeholder until API wiring restored
    setTimeout(() => {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          content: "API reconnect coming next.",
          modelUsed: "system",
        };
        return next;
      });

      setTyping(false);
      sendingRef.current = false;
    }, 1000);
  }

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="cipher-wrap">
      <HeaderMenu title="CIPHER" onOpenDrawer={() => setDrawerOpen(true)} />

      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cipherCoin={coinBalance}
        onInvite={handleInvite}
        onOpenStore={() => (window.location.href = "/store")}
      />

      <div className="cipher-chat">
        <MessageList messages={messages} bottomRef={bottomRef} />
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
