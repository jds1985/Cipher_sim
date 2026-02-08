export default function QuickActions({ onSelect }) {
  const actions = [
    { label: "🧠 Summarize", prompt: "Summarize this." },
    { label: "💻 Explain Code", prompt: "Explain this code." },
    { label: "🧪 Analyze", prompt: "Analyze this." },
    { label: "✨ Improve", prompt: "Improve this writing." },
    { label: "📜 Longer", prompt: "Make this longer." },
    { label: "🧵 Shorter", prompt: "Make this shorter." },
  ];

  return (
    <div style={{ display: "flex", gap: 8, padding: "8px 12px", flexWrap: "wrap" }}>
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => onSelect(a.prompt)}
          style={{
            background: "rgba(120,90,255,0.15)",
            border: "1px solid rgba(160,120,255,0.35)",
            color: "#ddd",
            padding: "6px 10px",
            borderRadius: 12,
            cursor: "pointer",
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
