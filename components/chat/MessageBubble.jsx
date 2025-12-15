export default function MessageBubble({ message, onShadowFlip }) {
  const isUser = message.role === "user";
  const isShadow = message.showing === "shadow";

  const bubbleStyle = {
    maxWidth: "80%",
    marginBottom: "12px",
    padding: "12px 14px",
    borderRadius: 14,
    fontSize: 15,
    lineHeight: 1.45,
    alignSelf: isUser ? "flex-end" : "flex-start",

    background: isUser
      ? "#1f2937"                 // user bubble (dark neutral)
      : isShadow
      ? "#000000"                 // 🖤 SHADOWFLIP — PURE BLACK
      : "#5b2cff",                // 🟣 CIPHER — PURPLE

    color: isShadow
      ? "#9ca3af"                 // grey text for shadow
      : "#ffffff",                // white text for cipher + user

    border: isShadow
      ? "1px solid #1f1f1f"       // subtle edge so black doesn’t vanish
      : "none",

    boxShadow: isShadow
      ? "inset 0 0 0 1px #000"
      : "0 4px 14px rgba(91,44,255,0.35)", // purple glow
  };

  return (
    <div style={bubbleStyle} onClick={!isUser ? onShadowFlip : undefined}>
      {!isUser && isShadow && (
        <div
          style={{
            fontSize: 10,
            letterSpacing: "1px",
            color: "#6b7280",
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          Shadowflip
        </div>
      )}

      {isShadow ? message.shadowText : message.text}
    </div>
  );
}
