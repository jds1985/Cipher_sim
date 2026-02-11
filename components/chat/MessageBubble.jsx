// components/chat/MessageBubble.jsx

export default function MessageBubble({
  role,
  content,
  modelUsed = null,
  memoryUsed = [],
}) {
  const style = bubble(role);

  return (
    <div style={style}>
      <div style={{ whiteSpace: "pre-wrap" }}>{content || "…"}</div>

      {modelUsed && role !== "user" && (
        <div
          style={{
            marginTop: 10,
            opacity: 0.65,
            fontSize: 12,
          }}
        >
          {String(modelUsed)}
        </div>
      )}

      {/* ⭐ MEMORY VISIBILITY */}
      {Array.isArray(memoryUsed) && memoryUsed.length > 0 && role !== "user" && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 11,
            opacity: 0.7,
          }}
        >
          🧠 {memoryUsed.slice(0, 3).join(" • ")}
        </div>
      )}
    </div>
  );
}

function bubble(role) {
  if (role === "decipher") {
    return {
      maxWidth: "88%",
      padding: 14,
      borderRadius: 14,
      alignSelf: "flex-start",
      background: "rgba(15, 10, 20, 0.75)",
      border: "1px solid rgba(255,90,90,0.40)",
      color: "rgba(245,245,245,0.96)",
      fontWeight: 600,
    };
  }

  if (role === "user") {
    return {
      maxWidth: "88%",
      padding: 14,
      borderRadius: 18,
      alignSelf: "flex-end",
      background:
        "linear-gradient(135deg, rgba(90,70,255,0.95), rgba(180,120,255,0.78))",
    };
  }

  return {
    maxWidth: "88%",
    padding: 14,
    borderRadius: 18,
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.06)",
  };
}
