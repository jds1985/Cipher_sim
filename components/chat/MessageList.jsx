import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, onShadowFlip }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "16px",
        overflowY: "auto",
      }}
    >
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          message={msg}
          isUser={msg.role === "user"}
          onShadowFlip={() => onShadowFlip(i)}
        />
      ))}
    </div>
  );
}
