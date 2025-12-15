import { useRef } from "react";

export default function MessageBubble({ message, isUser, onShadowFlip }) {
  const startX = useRef(null);

  const isCipher = !isUser;
  const isShadow = Boolean(message.shadow);

  const haptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!isCipher || startX.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX.current;

    // swipe LEFT → activate Decipher
    if (deltaX < -60 && !isShadow) {
      haptic();
      onShadowFlip("on");
    }

    // swipe RIGHT → deactivate Decipher
    if (deltaX > 60 && isShadow) {
      haptic();
      onShadowFlip("off");
    }

    startX.current = null;
  };

  const bubbleStyle = {
    maxWidth: "75%",
    marginBottom: 14,
    padding: "14px 16px",
    borderRadius: 16,
    lineHeight: 1.45,
    alignSelf: isUser ? "flex-end" : "flex-start",

    background: isUser
      ? "#1f2937"
      : isShadow
      ? "#000000" // 🖤 Decipher
      : "#6d28d9", // 🟣 Cipher

    color: isShadow ? "#9ca3af" : "#ffffff",
    border: isShadow ? "1px solid #111" : "none",

    boxShadow: isShadow
      ? "inset 0 0 0 1px #000"
      : "0 3px 14px rgba(109,40,217,0.45)",

    transition: "all 0.25s ease",
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isShadow && (
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
        {isShadow ? message.shadow : message.content}
      </div>
    </div>
  );
}
