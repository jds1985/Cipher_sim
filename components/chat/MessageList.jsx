// components/chat/MessageList.jsx
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, bottomRef }) {
  return (
    <>
      {messages.map((m, i) => (
        <MessageBubble key={i} role={m.role} content={m.content} />
      ))}
      <div ref={bottomRef} />
    </>
  );
}
