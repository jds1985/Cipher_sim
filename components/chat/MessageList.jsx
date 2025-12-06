// components/chat/MessageList.jsx
import React from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, theme, loading, chatEndRef }) {
  return (
    <>
      {messages.map((m, i) => (
        <MessageBubble key={i} msg={m} theme={theme} />
      ))}

      {loading && (
        <div style={{ fontStyle: "italic", color: theme.textColor }}>
          Cipher is thinking...
        </div>
      )}

      <div ref={chatEndRef} />
    </>
  );
}
