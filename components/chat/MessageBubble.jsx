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
}) {
  const handleClick = () => {
    if (!selectable) return;
    onSelect?.(index);
  };

  const handleMemoryClick = (e) => {
    e.stopPropagation();
    onSelect?.(index, { openMemory: true });
  };

  return (
    <div
      className={`cipher-bubble ${role} ${
        isSelected ? "selected" : ""
      } ${transforming ? "transforming" : ""}`}
      onClick={handleClick}
    >
      <div className="cipher-text">
        {content}
      </div>

      {role === "assistant" && (
        <div className="cipher-meta">
          {modelUsed && (
            <span className="cipher-model">
              {modelUsed}
            </span>
          )}

          {memoryInfluence && memoryInfluence.length > 0 && (
            <button
              className="cipher-btn-memory"
              onClick={handleMemoryClick}
            >
              Memory
            </button>
          )}
        </div>
      )}
    </div>
  );
}
