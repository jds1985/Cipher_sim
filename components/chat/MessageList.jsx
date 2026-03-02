import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  bottomRef,
  onSelectMessage,
  selectedIndex,
  tier = "free",
  typing = false,
}) {
  return (
    <div className="cipher-messages">
      {messages.map((m, i) => {
        const selectable = m.role !== "user";

        // only show typing dots on the LAST assistant bubble while typing
        const isLast = i === messages.length - 1;
        const isTypingBubble = Boolean(typing && isLast && m.role === "assistant");

        return (
          <MessageBubble
            key={i}
            index={i}
            role={m.role}
            content={m.content}
            modelUsed={m.modelUsed || null}
            memoryInfluence={m.memoryInfluence || []}
            isSelected={selectedIndex === i}
            selectable={selectable}
            onSelect={onSelectMessage}
            transforming={Boolean(m.transforming)}
            tier={tier}
            isTyping={isTypingBubble}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
