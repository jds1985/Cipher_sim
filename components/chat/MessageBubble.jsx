import { useState, useRef } from "react";

export default function MessageBubble({
  index,
  role,
  content,
  modelUsed = null,
  memoryInfluence = null,
  isSelected = false,
  onSelect,
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

  function handleSelect() {
    if (isUser) return;
    onSelect?.(index);
  }

  return (
    <div
      className="cipher-row"
      onClick={handleSelect}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "8px 12px",
        cursor: isUser ? "default" : "pointer",
      }}
    >
      <div
        className={
          isUser
            ? "cipher-msg-user cipher-live"
            : "cipher-msg-assistant"
        }
        style={{
          maxWidth: "75%",
          width: "fit-content",
          outline: isSelected
            ? "2px solid rgba(0,255,200,0.9)"
            : "none",
        }}
      >
        {/* TEXT */}
        <div className="cipher-text">{content || "…"}</div>

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
