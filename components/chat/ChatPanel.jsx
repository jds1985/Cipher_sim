import { useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    if (!text) return;

    const userMsg = {
      role: "user",
      content: text,
    };

    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      const cipherMsg = {
        role: "assistant",
        content: data.reply,
        shadow: null, // will be generated on demand
      };

      setMessages((m) => [...m, cipherMsg]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Cipher hit a server error.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateShadow = async (index) => {
    const msg = messages[index];
    if (!msg || msg.shadow) return;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg.content,
        mode: "shadow",
      }),
    });

    const data = await res.json();

    setMessages((m) =>
      m.map((item, i) =>
        i === index ? { ...item, shadow: data.reply } : item
      )
    );
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#000",
      }}
    >
      <MessageList messages={messages} onShadowFlip={generateShadow} />
      <InputBar onSend={sendMessage} disabled={loading} />
    </div>
  );
}
