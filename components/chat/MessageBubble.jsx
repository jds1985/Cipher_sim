// components/chat/MessageBubble.jsx

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isShadow = message.mode === "shadow";

  let bg = "#2b2b2b";
  let color = "#fff";

  if (isUser) {
    bg = "#3a3a3a";
  } else if (isShadow) {
    bg = "#0b0b0b";
    color = "#aaa";
  } else {
    bg = "#6f2dbd"; // purple Cipher
  }

  return (
    <div
      style={{
        maxWidth: "80%",
        marginBottom: 10,
        padding: "12px 16px",
        borderRadius: 16,
        background: bg,
        color,
        alignSelf: isUser ? "flex-end" : "flex-start",
        boxShadow: isShadow ? "0 0 0 1px #222" : "none",
      }}
    >
      {isShadow && (
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
          DECIPHER
        </div>
      )}
      {message.content}
    </div>
  );
}
