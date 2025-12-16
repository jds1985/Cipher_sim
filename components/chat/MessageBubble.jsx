// components/chat/MessageBubble.jsx
export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isDecipher = message.mode === "decipher";

  const bg = isUser
    ? "#2a2a2a"
    : isDecipher
    ? "#000"
    : "#6b2bd1";

  const color = isDecipher ? "#b5b5b5" : "#fff";

  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        background: bg,
        color,
        padding: "14px 16px",
        borderRadius: 16,
        maxWidth: "80%",
        boxShadow: "0 0 12px rgba(0,0,0,0.6)",
      }}
    >
      {isDecipher && (
        <div
          style={{
            fontSize: 10,
            opacity: 0.6,
            marginBottom: 6,
            letterSpacing: 1,
          }}
        >
          DECIPHER
        </div>
      )}
      {message.content}
    </div>
  );
}
