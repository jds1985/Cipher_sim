export default function MessageBubble({ message, isUser, onShadowFlip }) {
  const isCipher = !isUser;
  const showShadow = Boolean(message.shadow);

  const bubbleStyle = {
    maxWidth: "75%",
    marginBottom: 12,
    padding: "12px 14px",
    borderRadius: 14,
    lineHeight: 1.4,
    cursor: isCipher ? "pointer" : "default",
    alignSelf: isUser ? "flex-end" : "flex-start",
    background: isUser
      ? "#1f2937"
      : showShadow
      ? "#000"
      : "#6d28d9", // purple Cipher
    color: showShadow ? "#9ca3af" : "#fff",
    border: showShadow ? "1px solid #111" : "none",
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      onClick={isCipher && !showShadow ? onShadowFlip : undefined}
    >
      {showShadow && (
        <div
          style={{
            fontSize: 10,
            color: "#6b7280",
            marginBottom: 4,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Decipher
        </div>
      )}

      <div style={bubbleStyle}>
        {showShadow ? message.shadow : message.content}
      </div>
    </div>
  );
}
