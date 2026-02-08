// components/chat/QuickActions.jsx

export default function QuickActions({ onSelect, disabled = false }) {
  const actions = [
    { label: "🧠 Summarize", prompt: "Summarize this." },
    { label: "💻 Explain Code", prompt: "Explain this code." },
    { label: "🧪 Analyze", prompt: "Analyze this." },
    { label: "✨ Improve", prompt: "Improve this writing." },
    { label: "📜 Longer", prompt: "Make this longer." },
    { label: "🧵 Shorter", prompt: "Make this shorter." },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "10px 12px",
        flexWrap: "wrap",
      }}
    >
      {actions.map((a) => (
        <button
          key={a.label}
          disabled={disabled}
          onClick={() => !disabled && onSelect(a.prompt)}
          style={{
            background: "rgba(120,90,255,0.14)",
            border: "1px solid rgba(160,120,255,0.35)",
            color: "#ddd",
            padding: "7px 12px",
            borderRadius: 14,
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.15s ease",
            opacity: disabled ? 0.5 : 1,
          }}
          onMouseDown={(e) => {
            if (disabled) return;
            e.currentTarget.style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
