import { useRef } from "react";

export default function MessageBubble({ message, onShadowFlip }) {
  const startX = useRef(null);

  const isCipher = message.role === "cipher";
  const isShadow = message.showing === "shadow";

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (!isCipher) return;
    const endX = e.changedTouches[0].clientX;
    if (startX.current - endX > 60) {
      onShadowFlip?.();
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        background: isCipher
          ? isShadow
            ? "#000"
            : "#111"
          : "#1f2937",
        color: isShadow ? "#9ca3af" : "#fff",
        padding: "12px",
        borderRadius: "10px",
        marginBottom: "10px",
        maxWidth: "80%",
        alignSelf: isCipher ? "flex-start" : "flex-end",
        border: isShadow ? "1px solid #333" : "none",
      }}
    >
      {isShadow && (
        <div
          style={{
            fontSize: "11px",
            opacity: 0.6,
            marginBottom: "6px",
            letterSpacing: "0.08em",
          }}
        >
          SHADOWFLIP
        </div>
      )}

      {isShadow ? message.shadowText : message.text}
    </div>
  );
}
