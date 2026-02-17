import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  bottomRef,
  onSelectMessage,
  selectedIndex,
}) {
  return (
    <div className="cipher-messages">
      {messages.map((m, i) => {
        const selectable = m.role !== "user";

        return (
          <MessageBubble
            key={i}
            index={i}
            role={m.role}
            content={m.content}
            modelUsed={m.modelUsed || null}
            memoryInfluence={
              m.role === "assistant" || m.role === "decipher"
                ? m.memoryInfluence || null
                : null
            }
            transforming={m.transforming || false}
            isSelected={selectedIndex === i}
            selectable={selectable}
            onSelect={onSelectMessage}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
