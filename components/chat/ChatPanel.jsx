"use client";

import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("normal"); // normal | decipher
  const touchStartX = useRef(null);

  /* -------------------------------
     SWIPE HANDLERS (MESSAGE AREA ONLY)
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
    const userMessage = {
      role: "user",
      content: text,
      mode,
    };

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
        mode: data.modeUsed || mode, // 🔥 SERVER CONFIRMS MODE
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
      
      {/* MODE INDICATOR */}
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          letterSpacing: 2,
          padding: "6px 0",
          opacity: 0.65,
          color: mode === "decipher" ? "#888" : "#b388ff",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {mode === "decipher" ? "DECIPHER MODE" : "CIPHER MODE"}
      </div>

      <MessageList
        messages={messages}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      <InputBar onSend={sendMessage} />
    </div>
  );
}
