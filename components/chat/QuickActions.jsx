export default function QuickActions({ onAction, tier = "free", content }) {
  if (tier === "free") return null;

  const actions = [
    { id: "analyze", label: "Analyze", prompt: "Analyze the following response:" },
    { id: "shorter", label: "Shorter", prompt: "Rewrite the following response in a shorter form:" },
    { id: "longer", label: "Longer", prompt: "Expand the following response with more detail:" },
    { id: "summarize", label: "Summarize", prompt: "Summarize the following response:" },
  ];

  return (
    <div className="cipher-quick-actions">
      {actions.map((a) => (
        <button key={a.id} onClick={() => onAction(`${a.prompt}\n\n${content}`)}>
          {a.label}
        </button>
      ))}
    </div>
  );
}
