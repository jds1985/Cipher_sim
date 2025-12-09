// components/chat/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import { createBaseMemory, extractFactsIntoMemory } from "../../logic/memoryCore";

/* TEXT → /api/chat */
const sendTextToCipher = async ({ text, memory }) => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, userId: "jim", memory }),
    });

    return await res.json();
  } catch {
    return { reply: "API error." };
  }
};

/* IMAGE UPLOAD → /api/image_analyze */
const sendImageToCipher = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", "jim");

  try {
    const res = await fetch("/api/image_analyze", {
      method: "POST",
      body: formData,
    });

    return await res.json();
  } catch (err) {
    console.error("Image Upload Error:", err);
    return { reply: "Vision error." };
  }
};

export default function ChatPanel({ theme }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const chatEndRef = useRef(null);

  /* Load local chat */
  useEffect(() => {
    const stored = localStorage.getItem("cipher_messages_v3");
    if (stored) setMessages(JSON.parse(stored));

    const mem = localStorage.getItem("cipher_memory_v3");
    if (mem) setCipherMemory(JSON.parse(mem));
  }, []);

  /* Save chat */
  useEffect(() => {
    localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* TEXT SEND */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    const newMem = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(newMem);

    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    const { reply } = await sendTextToCipher({ text, memory: newMem });

    setMessages((prev) => [...prev, { role: "cipher", text: reply }]);
    setLoading(false);
  };

  /* IMAGE UPLOAD */
  const handleImageSelect = async (file) => {
    setLoading(true);

    const { reply } = await sendImageToCipher(file);

    setMessages((prev) => [...prev, { role: "cipher", text: reply }]);
    setLoading(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Chat Window */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: theme.panelBg,
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          overflowY: "auto",
        }}
      >
        <MessageList messages={messages} theme={theme} chatEndRef={chatEndRef} />
      </div>

      {/* Input Bar */}
      <InputBar
        input={input}
        setInput={setInput}
        onSend={handleSendText}
        onImageSelect={handleImageSelect}
        theme={theme}
      />
    </div>
  );
}
