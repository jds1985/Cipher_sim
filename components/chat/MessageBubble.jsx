import { useState, useRef } from "react";

export default function MessageBubble({
  role,
  content,
  modelUsed = null,
  memoryInfluence = null,
}) {
  const cleanRole = String(role || "").trim();

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

      if (audioRef.current) audioRef.current.pause();

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

  const isUser = cleanRole === "user";

  return (
    <div
      className="cipher-row"
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "8px 12px",
      }}
    >
      <div
        className={
          isUser ? "cipher-msg-user cipher-live" : "cipher-msg-assistant"
        }
        style={{
          maxWidth: "75%",
          width: "fit-content",
        }}
      >
        {/* TEXT */}
        <div className="cipher-text">{content || "…"}</div>

        {/* ACTION ROW */}
        {cleanRole !== "user" && content && (
          <div className="cipher-actions">
            {modelUsed && (
              <div className="cipher-model">
                {provider ? `${provider} / ` : ""}
                {String(model)}
              </div>
            )}

            <div className="cipher-buttons">
              <button
                onClick={speak}
                className={`cipher-btn-secondary ${
                  speaking ? "cipher-live" : ""
                }`}
              >
                {speaking ? "speaking…" : "speak"}
              </button>

              <button onClick={copy} className="cipher-btn-secondary">
                copy
              </button>
            </div>
          </div>
        )}

        {/* MEMORY */}
        {memoryInfluence &&
          memoryInfluence.length > 0 &&
          cleanRole !== "user" && (
            <div className="cipher-memory">
              <div
                onClick={() => setOpen(!open)}
                className="cipher-memory-toggle"
              >
                {open
                  ? `Hide memory (${memoryInfluence.length})`
                  : `Memory used (${memoryInfluence.length})`}
              </div>

              {open && (
                <div className="cipher-memory-list">
                  {memoryInfluence.map((m, i) => (
                    <div key={i} className="cipher-memory-item">
                      <div className="cipher-memory-meta">
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
    </div>
  );
}
