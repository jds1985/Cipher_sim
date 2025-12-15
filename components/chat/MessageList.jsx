import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, onShadowFlip }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "12px",
        overflowY: "auto",
        flex: 1,
      }}
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={index}
          message={message}
          onShadowFlip={() => onShadowFlip(index)}
        />
      ))}
    </div>
  );
}
