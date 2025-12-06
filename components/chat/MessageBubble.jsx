// components/chat/MessageBubble.jsx
import React from "react";
import CipherAudioPlayer from "./CipherAudioPlayer";

export default function MessageBubble({ msg, theme }) {
  const isUser = msg.role === "user";

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          alignSelf: isUser ? "flex-end" : "flex-start",
          background: isUser ? theme.userBubble : theme.cipherBubble,
          color: theme.textColor,
          padding: "10px 14px",
          borderRadius: 14,
          maxWidth: "80%",
          whiteSpace: "pre-wrap",
          marginLeft: isUser ? "auto" : 0,
          marginRight: isUser ? 0 : "auto",
          boxShadow: "0 0 10px rgba(0,0,0,0.4)",
          transition: "background 0.3s ease",
        }}
      >
        {msg.text}

        {/* Cipher voice button – only if audio present */}
        {!isUser && msg.voice && (
          <CipherAudioPlayer audioBase64={msg.voice} theme={theme} />
        )}
      </div>
    </div>
  );
}
