"use client";

import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("normal"); // normal | decipher
  const touchStartX = useRef(null);

  /* -------------------------------
     SWIPE HANDLERS
  -------------------------------- */

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    // Swipe left → DECIPHER
    if (deltaX < -60 && mode !== "decipher") {
      setMode("decipher");
      navigator.vibrate?.(40);
    }

    // Swipe right → NORMAL
    if (deltaX > 60 && mode !== "normal") {
      setMode("normal");
      navigator.vibrate?.(20);
    }

    touchStartX.current = null;
  }

  /* -------------------------------
     SEND MESSAGE
  -------------------------------- */

  async function sendMessage(text) {
    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode,
        }),
      });

      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.reply,
        mode,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("UI CHAT ERROR:", err);
    }
  }

  /* -------------------------------
     RENDER
  -------------------------------- */

  return (
    <div
      className="flex flex-col h-screen bg-black text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <MessageList messages={messages} />
      <InputBar onSend={sendMessage} />
    </div>
  );
}
