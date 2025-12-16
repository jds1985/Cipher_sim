// components/chat/ChatPanel.jsx
import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("normal");

  const modeRef = useRef("normal"); // 🔒 SOURCE OF TRUTH
  const touchStartX = useRef(null);

  function haptic() {
    if (navigator.vibrate) navigator.vibrate(25);
  }

  function switchMode(next) {
    if (modeRef.current === next) return;
    modeRef.current = next;
    setMode(next);
    haptic();
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    if (deltaX < -60) switchMode("decipher"); // swipe left
    if (deltaX > 60) switchMode("normal");   // swipe right

    touchStartX.current = null;
  }

  async function sendMessage(text) {
    const activeMode = modeRef.current; // 🔥 GUARANTEED CORRECT

    setMessages((m) => [...m, { role: "user", content: text }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: activeMode,
      }),
    });

    const data = await res.json();

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: data.reply,
        mode: activeMode,
      },
    ]);
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#000",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <MessageList messages={messages} />
      <InputBar onSend={sendMessage} />
    </div>
  );
}
