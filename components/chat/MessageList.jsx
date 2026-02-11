import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, bottomRef }) {
  return (
    <>
      {messages.map((m, i) => (
        <MessageBubble
          key={i}
          role={m.role}
          content={m.content}
          modelUsed={m.modelUsed || null}

          // ⭐ NEW — memory visibility
          memoryInfluence={
            m.role === "assistant" || m.role === "decipher"
              ? m.memoryInfluence || null
              : null
          }
        />
      ))}
      <div ref={bottomRef} />
    </>
  );
}
