import { useState, useRef } from "react";

export default function MessageBubble({
  role,
  content,
  modelUsed = null,
  memoryInfluence = null,
}) {
  const cleanRole = String(role || "").trim();
  const style = bubble(cleanRole);

  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const provider =
    typeof modelUsed === "object" ? modelUsed?.provider : null;
  const model =
    typeof modelUsed === "object" ? modelUsed?.model : modelUsed;

  function copy() {
    try {
      navigator.clipboard.writeText(content || "");
    } catch {}
  }

  async function speak() {
    if (!content || speaking) return;

    try {
      setSpeaking(true);

      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (!res.ok) throw new Error("voice failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);

      await audio.play();
    } catch (err) {
      console.error(err);
      setSpeaking(false);
    }
  }

  return (
    <div style={style}>
      {/* TEXT */}
      <div style={{ whiteSpace: "pre-wrap" }}>{content || "…"}</div>

      {/* ACTION ROW */}
      {cleanRole !== "user" && content && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            opacity: 0.85,
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {/* MODEL */}
          {modelUsed && (
            <div>
              {provider ? `${provider} / ` : ""}
              {String(model)}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {/* SPEAK */}
            <div
              onClick={speak}
              style={{
                cursor: speaking ? "default" : "pointer",
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: speaking
                  ? "rgba(140,100,255,0.25)"
                  : "transparent",
                boxShadow: speaking
                  ? "0 0 12px rgba(140,100,255,0.7)"
                  : "none",
                transition: "all 0.2s ease",
                fontSize: 12,
                opacity: speaking ? 0.9 : 1,
              }}
            >
              {speaking ? "🔊 speaking…" : "🔊 speak"}
            </div>

            {/* COPY */}
            <div
              onClick={copy}
              style={{
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 12,
              }}
            >
              copy
            </div>
          </div>
        </div>
      )}

      {/* MEMORY */}
      {memoryInfluence && memoryInfluence.length > 0 && cleanRole !== "user" && (
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
