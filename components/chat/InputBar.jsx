// components/chat/InputBar.jsx
import { useState } from "react";

export default function InputBar({ onSend }) {
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <div
      style={{
        display: "flex",
        padding: 12,
        borderTop: "1px solid #222",
        background: "#000",
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message for Cipher…"
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          background: "#111",
          color: "#fff",
          border: "none",
        }}
      />
      <button
        onClick={send}
        style={{
          marginLeft: 8,
          padding: "12px 18px",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: 10,
        }}
      >
        Send
      </button>
    </div>
  );
}
