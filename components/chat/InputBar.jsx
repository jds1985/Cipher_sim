// components/chat/InputBar.jsx
import { useState } from "react";

export default function InputBar({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return; // prevent empty sends
    console.log("InputBar sending:", text);
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        padding: "12px",
        background: "#000",
        borderTop: "1px solid #333",
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message for Cipher..."
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: 8,
          border: "1px solid #333",
          background: "#111",
          color: "white",
          outline: "none",
        }}
      />

      <button
        onClick={send}
        style={{
          marginLeft: 8,
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}
