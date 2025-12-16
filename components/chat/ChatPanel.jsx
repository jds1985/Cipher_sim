// components/chat/ChatPanel.jsx

import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("normal"); // normal | shadow

  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    // Swipe LEFT → ShadowFlip
    if (deltaX < -60 && mode !== "shadow") {
      setMode("shadow");
      navigator.vibrate?.(20);
    }

    // Swipe RIGHT → Normal Cipher
    if (deltaX > 60 && mode !== "normal") {
      setMode("normal");
      navigator.vibrate?.(15);
    }

    touchStartX.current = null;
  };

  const sendMessage = async (text) => {
    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode }),
      });

      const data = await res.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, mode },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Cipher hit a server error.", mode },
      ]);
    }
  };

  return (
    <div
      style={{ height: "100vh", background: "#000" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <MessageList messages={messages} />
      <InputBar onSend={sendMessage} />
    </div>
  );
}
