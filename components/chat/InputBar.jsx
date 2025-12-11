// components/chat/InputBar.jsx
import { useState } from "react";

export default function InputBar({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    console.log("SENDING:", text);
    onSend(text);
    setText("");
  };

  return (
    <div style={{
      display: "flex",
      padding: "10px",
      background: "#000",
      borderTop: "1px solid #333",
    }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message for Cipher..."
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: 6,
        }}
      />
      <button onClick={send} style={{ marginLeft: 6, padding: "10px 14px" }}>
        Send
      </button>
    </div>
  );
}
