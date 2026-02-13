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
    <div className="cipher-qa">
      {actions.map((a) => (
        <button
          key={a.id}
          className="cipher-btn"
          type="button"
          onClick={() => onSelect?.(a.id)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
