import { useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // SEND NORMAL MESSAGE
  const sendMessage = async (text) => {
    if (!text || loading) return;

    const userMsg = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
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
        shadow: null, // Decipher text (lazy-loaded)
      };

      setMessages((prev) => [...prev, cipherMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Cipher hit a server error.",
          shadow: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // SHADOWFLIP HANDLER
  const handleShadowFlip = async (index, direction) => {
    setMessages((prev) => {
      const copy = [...prev];

      // Swipe RIGHT → turn OFF shadow
      if (direction === "off") {
        copy[index] = { ...copy[index], shadow: null };
        return copy;
      }

      return copy;
    });

    if (direction === "off") return;

    const msg = messages[index];
    if (!msg || msg.shadow) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg.content,
          mode: "shadow",
        }),
      });

      const data = await res.json();

      setMessages((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], shadow: data.reply };
        return copy;
      });
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          shadow: "Decipher failed to surface the truth.",
        };
        return copy;
      });
    }
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
      <MessageList
        messages={messages}
        onShadowFlip={handleShadowFlip}
      />

      <InputBar onSend={sendMessage} disabled={loading} />
    </div>
  );
}
