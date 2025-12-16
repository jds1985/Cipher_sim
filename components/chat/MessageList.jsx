// components/chat/MessageList.jsx

import MessageBubble from "./MessageBubble";

export default function MessageList({ messages }) {
  return (
    <div style={{ padding: 16 }}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
    </div>
  );
}
