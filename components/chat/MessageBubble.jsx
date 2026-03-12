import TypingText from "./TypingText";

export default function MessageBubble({
  index,
  role,
  content,
  modelUsed,
  isSelected,
  selectable,
  onSelect,
  transforming,
  isTyping = false,
}) {
  const handleClick = () => {
    if (!selectable) return;
    onSelect?.(index);
  };

  // 🔊 OpenAI Voice Playback
  const handleSpeak = async (e) => {
    e.stopPropagation();
    if (!content) return;

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          voice: "alloy",
        }),
      });

      if (!res.ok) throw new Error("Voice request failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error("Voice playback error:", err);
    }
  };

  const showTyping =
    role === "assistant" && isTyping && (!content || content.trim() === "");

  const shouldAnimate =
    role === "assistant" && isTyping && content && content.trim().length > 0;

  return (
    <div
      className={`cipher-bubble ${role} ${isSelected ? "selected" : ""} ${
        transforming ? "transforming" : ""
      }`}
      onClick={handleClick}
      style={{ cursor: selectable ? "pointer" : "default" }}
    >
      <div className="cipher-text" onClick={handleClick}>
        {showTyping ? (
          <span className="cipher-typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </span>
        ) : role === "assistant" ? (
          shouldAnimate ? (
            <TypingText text={content || ""} />
          ) : (
            content
          )
        ) : (
          content
        )}
      </div>

      {role === "assistant" && content && (
        <div className="cipher-meta">
          {modelUsed && <span className="cipher-model">{modelUsed}</span>}

          <button className="cipher-btn-speak" onClick={handleSpeak}>
            🔊 Speak
          </button>
        </div>
      )}
    </div>
  );
}
