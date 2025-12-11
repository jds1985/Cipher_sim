// components/ChatInput.jsx
// Cipher Input Bar 10.0 – Stable Version

import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form className="chat-input-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message for Cipher…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="chat-input"
      />

      <button className="send-btn" type="submit">
        Send
      </button>
    </form>
  );
}
