import { useState, useRef } from "react";

export default function MessageBubble({
  index,
  role,
  content,
  modelUsed = null,
  memoryInfluence = null,
  transforming = false,
  isSelected = false,
  selectable = true,
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

  function handleSelect(e) {
    if (!selectable || isUser) return;
    e.stopPropagation();
    isSelected ? onSelect?.(null) : onSelect?.(index);
  }

  const memoryCount = Array.isArray(memoryInfluence)
    ? memoryInfluence.length
    : 0;

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
        onClick={handleSelect}
        className={
          isUser ? "cipher-msg-user cipher-live" : "cipher-msg-assistant"
        }
        style={{
          maxWidth: "75%",
          width: "fit-content",
          cursor: selectable && !isUser ? "pointer" : "default",
          boxShadow: isSelected ? "0 0 0 2px rgba(0,255,200,0.9)" : "none",
          transition: "box-shadow 0.15s ease",
          opacity: transforming ? 0.75 : 1,
        }}
      >
        {/* MODEL + MEMORY HEADER */}
        {!isUser && (
          <div
            style={{
              fontSize: "11px",
              opacity: 0.65,
              marginBottom: "6px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {modelUsed && <span>model: {modelUsed}</span>}
            {memoryCount > 0 && <span>memory: {memoryCount}</span>}
          </div>
        )}

        {/* TEXT */}
        <div className="cipher-text">
          {transforming ? "Thinking…" : content || "…"}
        </div>

        {/* SPEAK + COPY */}
        {!isUser && content && !transforming && (
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
