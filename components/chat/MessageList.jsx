import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, bottomRef }) {
  return (
    <>
      {messages.map((m, i) => (
        <MessageBubble
          key={i}
          role={m.role}
          content={m.content}
          modelUsed={m.modelUsed || null}   // ⭐ badge info
        />
      ))}
      <div ref={bottomRef} />
    </>
  );
}
