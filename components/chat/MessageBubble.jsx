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

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (!content) return;

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    window.speechSynthesis.cancel(); // stop any current speech
    window.speechSynthesis.speak(utterance);
  };

  const showTyping =
    role === "assistant" && isTyping && (!content || content.trim() === "");

  return (
    <div
      className={`cipher-bubble ${role} ${isSelected ? "selected" : ""} ${
        transforming ? "transforming" : ""
      }`}
      onClick={handleClick}
    >
      <div className="cipher-text">
        {showTyping ? (
          <span className="cipher-typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </span>
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
