// components/InputBar.js
// Cipher InputBar 10.0

import { useState } from "react";

export default function InputBar({ onSend }) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <div className="w-full flex items-center space-x-2">
      <input
        className="flex-1 bg-[#0d0d0d] text-gray-300 border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-600"
        placeholder="Speak to Cipher…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      <button
        onClick={handleSend}
        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl"
      >
        Send
      </button>
    </div>
  );
}
