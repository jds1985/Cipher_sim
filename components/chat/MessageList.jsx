import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  bottomRef,
  onPlayVoice,
  onQuickAction,
}) {
  return (
    <div className="cipher-messages">
      {messages.map((m, i) => (
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
          onPlayVoice={onPlayVoice}
          onQuickAction={onQuickAction}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
