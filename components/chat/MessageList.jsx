import MessageBubble from "./MessageBubble";
import QuickActions from "./QuickActions";

export default function MessageList({
  messages,
  bottomRef,
  onSelectMessage,
  selectedIndex,
  tier = "free",
  typing = false,
  onQuickAction,
}) {
  return (
    <div className="cipher-messages">
      {messages.map((m, i) => {
        const selectable = m.role !== "user";

        const isLast = i === messages.length - 1;

        const isTypingBubble = Boolean(
          typing && isLast && m.role === "assistant" && !m.content
        );

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column"
            }}
          >
            <MessageBubble
              index={i}
              role={m.role}
              content={m.content}
              modelUsed={m.modelUsed || null}
              memoryInfluence={m.memoryInfluence || []}
              isSelected={selectedIndex === i}
              selectable={selectable}
              transforming={Boolean(m.transforming)}
              tier={tier}
              isTyping={isTypingBubble}
              onSelect={(index, action) => {

                if (action?.openMemory) {
                  console.log("Memory clicked", index);
                  return;
                }

                if (action?.openDecipher) {
                  console.log("Decipher clicked", index);
                  return;
                }

                // ⭐ normal tap selection
                if (onSelectMessage) {
                  onSelectMessage(index);
                }
              }}
            />

            {selectedIndex === i && tier !== "free" && (
              <QuickActions
                tier={tier}
                onAction={(prompt) => {
                  if (onQuickAction) {
                    onQuickAction(prompt, m.content);
                  }
                }}
              />
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
