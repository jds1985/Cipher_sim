// components/chat/ChatPanel.jsx
import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("normal"); // normal | decipher
  const touchStartX = useRef(null);

  function haptic() {
    if (navigator.vibrate) navigator.vibrate(20);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    if (deltaX < -60 && mode !== "decipher") {
      setMode("decipher");
      haptic();
    }

    if (deltaX > 60 && mode !== "normal") {
      setMode("normal");
      haptic();
    }

    touchStartX.current = null;
  }

  async function sendMessage(text) {
    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);

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
