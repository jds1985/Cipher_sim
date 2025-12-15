import { useRef } from "react";

export default function MessageBubble({ message, isUser, onShadowFlip }) {
  const startX = useRef(null);

  const isCipher = !isUser;
  const showShadow = Boolean(message.shadow);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!startX.current || showShadow || !isCipher) return;

    const endX = e.changedTouches[0].clientX;
    const deltaX = startX.current - endX;

    // swipe LEFT threshold
    if (deltaX > 50) {
      onShadowFlip();
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
      : showShadow
      ? "#000000"
      : "#6d28d9",

    color: showShadow ? "#9ca3af" : "#ffffff",

    border: showShadow ? "1px solid #111" : "none",
    boxShadow: showShadow
      ? "inset 0 0 0 1px #000"
      : "0 2px 10px rgba(0,0,0,0.35)",

    transition: "all 0.25s ease",
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
