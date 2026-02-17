export default function QuickActions({ onAction }) {
  const actions = [
    { id: "analyze", label: "Analyze", prompt: "Analyze this answer:" },
    { id: "shorter", label: "Shorter", prompt: "Make this shorter:" },
    { id: "longer", label: "Longer", prompt: "Expand this answer:" },
    { id: "summarize", label: "Summarize", prompt: "Summarize this:" },
  ];

  return (
    <div className="cipher-quick-actions">
      {actions.map((a) => (
        <button key={a.id} onClick={() => onAction(a.prompt)}>
          {a.label}
        </button>
      ))}
    </div>
  );
}
