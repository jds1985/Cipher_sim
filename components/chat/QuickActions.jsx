// components/chat/QuickActions.jsx

export default function QuickActions({ onSelect }) {
  const actions = [
    { id: "summarize", label: "Summarize" },
    { id: "explain_code", label: "Explain Code" },
    { id: "analyze", label: "Analyze" },
    { id: "improve", label: "Improve" },
    { id: "longer", label: "Longer" },
    { id: "shorter", label: "Shorter" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        padding: "10px 12px",
        justifyContent: "center",
      }}
    >
      {actions.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect?.(a.id)}
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid rgba(180,150,255,0.25)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
