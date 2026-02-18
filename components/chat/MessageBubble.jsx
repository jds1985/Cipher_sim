export default function MessageBubble({
  index,
  role,
  content,
  modelUsed,
  memoryInfluence,
  isSelected,
  selectable,
  onSelect,
}) {
  const handleClick = () => {
    if (!selectable) return;
    onSelect?.(index);
  };

  return (
    <div
      className={`cipher-bubble ${role} ${
        isSelected ? "selected" : ""
      }`}
      onClick={handleClick}
    >
      <div className="cipher-text">{content}</div>

      {role === "assistant" && (
        <div className="cipher-meta">
          {modelUsed && (
            <span className="cipher-model">{modelUsed}</span>
          )}

          {memoryInfluence && memoryInfluence.length > 0 && (
            <button
              className="cipher-btn-memory"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Memory tapped:", memoryInfluence);
              }}
            >
              Memory
            </button>
          )}
        </div>
      )}
    </div>
  );
}
