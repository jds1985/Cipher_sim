import { useState } from "react";

export default function MessageBubble({
  role,
  content,
  modelUsed = null,
  memoryInfluence = null,
}) {
  const style = bubble(role);
  const [open, setOpen] = useState(false);

  const provider =
    typeof modelUsed === "object" ? modelUsed?.provider : null;
  const model =
    typeof modelUsed === "object" ? modelUsed?.model : modelUsed;

  function copy() {
    try {
      navigator.clipboard.writeText(content || "");
    } catch {}
  }

  return (
    <div style={style}>
      {/* TEXT */}
      <div style={{ whiteSpace: "pre-wrap" }}>{content || "…"}</div>

      {/* MODEL BADGE */}
      {modelUsed && role !== "user" && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          <div>
            {provider ? `${provider} / ` : ""}
            {String(model)}
          </div>

          <div
            onClick={copy}
            style={{
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 11,
            }}
          >
            copy
          </div>
        </div>
      )}

      {/* MEMORY */}
      {memoryInfluence && memoryInfluence.length > 0 && role !== "user" && (
        <div style={{ marginTop: 12 }}>
          <div
            onClick={() => setOpen(!open)}
            style={{
              cursor: "pointer",
              fontSize: 13,
              opacity: 0.85,
              userSelect: "none",
            }}
          >
            {open
              ? `▲ Hide memory (${memoryInfluence.length})`
              : `▼ Memory used (${memoryInfluence.length})`}
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
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ opacity: 0.6 }}>
                    {m?.type || "unknown"}{" "}
                    {m?.locked ? "• locked" : ""}{" "}
                    {m?.importance ? `• ${m.importance}` : ""}
                  </div>
                  <div>{m?.preview || "—"}</div>
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
