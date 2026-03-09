export default function MessageBubble({
  index,
  role,
  content,
  modelUsed,
  memoryInfluence,
  isSelected,
  selectable,
  onSelect,
  transforming,
  tier = "free",
  isTyping = false,
}) {
  const handleClick = () => {
    if (!selectable) return;
    onSelect?.(index);
  };

  const handleMemoryClick = (e) => {
    e.stopPropagation();
    onSelect?.(index, { openMemory: true });
  };

  const handleDecipherClick = (e) => {
    e.stopPropagation();
    onSelect?.(index, { openDecipher: true });
  };

  const showTyping =
    role === "assistant" &&
    isTyping &&
    (!content || content.trim() === "");

  const canShowMemory =
    role === "assistant" &&
    Array.isArray(memoryInfluence) &&
    memoryInfluence.length > 0;

  const canShowDecipher = role === "assistant" && tier === "free";

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

      {role === "assistant" && (
        <div className="cipher-meta">
          {modelUsed && <span className="cipher-model">{modelUsed}</span>}

          {canShowMemory && (
            <button className="cipher-btn-memory" onClick={handleMemoryClick}>
              Memory
            </button>
          )}

          {canShowDecipher && (
            <button className="cipher-btn-memory" onClick={handleDecipherClick}>
              Decipher
            </button>
          )}
        </div>
      )}
    </div>
  );
}
