import { useState, useRef } from "react";

export default function MessageBubble({
  index,
  role,
  content,
  modelUsed = null,
  memoryInfluence = null,
  onQuickAction,
}) {
  const cleanRole = String(role || "").trim();
  const isUser = cleanRole === "user";

  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  function copy(e) {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(content || "");
    } catch {}
  }

  async function speak(e) {
    e.stopPropagation();
    if (!content || speaking) return;

    try {
      setSpeaking(true);

      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setSpeaking(false);
      await audio.play();
    } catch {
      setSpeaking(false);
    }
  }

  function fireQuick(e, instruction) {
    e.stopPropagation();
    onQuickAction?.(index, instruction);
  }

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
        style={{ maxWidth: "75%", width: "fit-content" }}
      >
        {/* TEXT */}
        <div className="cipher-text">{content || "…"}</div>

        {/* QUICK ACTIONS */}
        {!isUser && content && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              className="cipher-btn-secondary"
              onClick={(e) => fireQuick(e, "Analyze this answer:")}
            >
              Analyze
            </button>

            <button
              className="cipher-btn-secondary"
              onClick={(e) => fireQuick(e, "Make this shorter:")}
            >
              Shorter
            </button>

            <button
              className="cipher-btn-secondary"
              onClick={(e) => fireQuick(e, "Expand this answer:")}
            >
              Longer
            </button>

            <button
              className="cipher-btn-secondary"
              onClick={(e) => fireQuick(e, "Summarize this:")}
            >
              Summarize
            </button>
          </div>
        )}

        {/* SPEAK + COPY */}
        {!isUser && content && (
          <div className="cipher-actions">
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
      </div>
    </div>
  );
}
