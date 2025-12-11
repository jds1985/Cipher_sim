// components/ChatPanel.js
// Cipher ChatPanel 10.0

import { useState } from "react";
import InputBar from "./InputBar";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);

  async function sendMessage(text) {
    if (!text.trim()) return;

    // Add user message instantly
    setMessages((prev) => [
      ...prev,
      { from: "user", text },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId: "jim_default"
        }),
      });

      const data = await res.json();

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          { from: "cipher", text: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "cipher", text: "Cipher could not respond." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { from: "cipher", text: "Network error." },
      ]);
    }
  }

  return (
    <div className="flex flex-col h-full w-full px-4 py-2">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`w-full flex ${
              m.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl max-w-[70%] ${
                m.from === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-[#111] border border-[#333] text-gray-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <InputBar onSend={sendMessage} />
    </div>
  );
}
