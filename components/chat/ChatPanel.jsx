"use client";

import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("normal"); // UI display only

  // 🔥 AUTHORITATIVE MODE (NO LAG)
  const modeRef = useRef("normal");
  const touchStartX = useRef(null);

  /* -------------------------------
     SWIPE HANDLERS (MESSAGE AREA)
  -------------------------------- */

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    // Swipe LEFT → DECIPHER
    if (deltaX < -60 && modeRef.current !== "decipher") {
      modeRef.current = "decipher";
      setMode("decipher");
      navigator.vibrate?.(40);
    }

    // Swipe RIGHT → NORMAL
    if (deltaX > 60 && modeRef.current !== "normal") {
      modeRef.current = "normal";
      setMode("normal");
      navigator.vibrate?.(20);
    }

    touchStartX.current = null;
  }

  /* -------------------------------
     SEND MESSAGE (MODE-SAFE)
  -------------------------------- */

  async function sendMessage(text) {
    const activeMode = modeRef.current;

    // USER MESSAGE
    const userMessage = {
      role: "user",
      content: text,
      mode: activeMode,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: activeMode, // 🔥 GUARANTEED CORRECT
        }),
      });

      const data = await res.json();

      // AI MESSAGE (SERVER-CONFIRMED MODE)
      const aiMessage = {
        role: "assistant",
        content: data.reply,
        mode: data.modeUsed,
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
    <div className="flex flex-col h-screen bg-black text-white">
      <MessageList
        messages={messages}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <InputBar onSend={sendMessage} />
    </div>
  );
}
