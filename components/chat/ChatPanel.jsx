import { useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(text) {
    if (!text || loading) return;

    const userMessage = {
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "cipher",
          text: data.reply,
          shadowText: null,
          showing: "normal",
          originalUserMessage: text,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "cipher",
          text: "Cipher hit a server error. Check logs.",
          shadowText: null,
          showing: "normal",
          originalUserMessage: text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchShadowFlip(index) {
    const target = messages[index];
    if (!target || target.shadowText) {
      // already fetched
      setMessages((prev) => {
        const copy = [...prev];
        copy[index].showing = "shadow";
        return copy;
      });
      return;
    }

    // flip immediately for UX
    setMessages((prev) => {
      const copy = [...prev];
      copy[index].showing = "shadow";
      return copy;
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: target.originalUserMessage,
          mode: "shadow",
        }),
      });

      const data = await res.json();

      setMessages((prev) => {
        const copy = [...prev];
        copy[index].shadowText = data.reply;
        return copy;
      });
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[index].shadowText = "ShadowFlip failed.";
        return copy;
      });
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#000",
      }}
    >
      <MessageList messages={messages} onShadowFlip={fetchShadowFlip} />
      <InputBar onSend={sendMessage} />
    </div>
  );
}
