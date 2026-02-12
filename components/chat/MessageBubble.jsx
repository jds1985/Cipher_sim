// components/chat/MessageBubble.jsx
import { useState } from "react";

export default function MessageBubble({
  role,
  content,
  modelUsed = null,
  memoryInfluence = null,
}) {
  const style = bubble(role);

  const [open, setOpen] = useState(false);

  return (
    <div style={style}>
      <div style={{ whiteSpace: "pre-wrap" }}>{content || "…"}</div>

      {/* Model */}
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

      {/* 🧠 Collapsible Memory */}
      {memoryInfluence && memoryInfluence.length > 0 && role !== "user" && (
        <div style={{ marginTop: 12 }}>
          <div
            onClick={() => setOpen(!open)}
            style={{
              cursor: "pointer",
              fontSize: 13,
              opacity: 0.8,
              userSelect: "none",
            }}
          >
            {open ? "▲ Hide memory" : "▼ Memory used"}
          </div>

          {open && (
            <div
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 12,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 12,
              }}
            >
              {memoryInfluence.map((m, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ opacity: 0.6 }}>
                    {m.type} {m.locked ? "• locked" : ""}
                  </div>
                  <div>{m.preview}</div>
                </div>
              ))}
            </div>
          )}
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
      border: "1px solid rgba(190,150,255,0.22)",
    };
  }

  return {
    maxWidth: "88%",
    padding: 14,
    borderRadius: 18,
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(190,150,255,0.14)",
  };
}
