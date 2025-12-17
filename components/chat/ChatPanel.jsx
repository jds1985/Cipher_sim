"use client";

import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("normal"); // UI indicator
  const modeRef = useRef("normal");            // SOURCE OF TRUTH

  /* -------------------------------
     MODE TOGGLE (BUTTON)
  -------------------------------- */

  function toggleMode() {
    const nextMode = modeRef.current === "normal" ? "decipher" : "normal";
    modeRef.current = nextMode;
    setMode(nextMode);
    navigator.vibrate?.(nextMode === "decipher" ? 40 : 20);
  }

  /* -------------------------------
     SEND MESSAGE
  -------------------------------- */

  async function sendMessage(text) {
    const activeMode = modeRef.current;

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
          mode: activeMode,
        }),
      });

      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.reply,
        mode: data.modeUsed || activeMode,
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

      {/* 🔴 DIAGNOSTIC BANNER */}
      <div
        style={{
          background: "red",
          color: "white",
          padding: "14px",
          textAlign: "center",
          fontWeight: 900,
          fontSize: "18px",
        }}
      >
        🔴 CHATPANEL LIVE — THIS FILE IS ACTIVE
      </div>

      {/* MODE TOGGLE BAR */}
      <div
        style={{
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          borderBottom: "1px solid #222",
        }}
      >
        <button
          onClick={toggleMode}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            fontWeight: 700,
            letterSpacing: 1,
            cursor: "pointer",
            background: mode === "decipher" ? "#000" : "#6b2bd1",
            color: mode === "decipher" ? "#b5b5b5" : "#fff",
            boxShadow:
              mode === "decipher"
                ? "0 0 10px rgba(0,0,0,0.8)"
                : "0 0 14px rgba(107,43,209,0.7)",
          }}
        >
          {mode === "decipher" ? "DECIPHER MODE" : "CIPHER MODE"}
        </button>
      </div>

      {/* CHAT */}
      <MessageList messages={messages} />
      <InputBar onSend={sendMessage} />
    </div>
  );
}
