import { useEffect, useRef } from "react";

export default function QuickActions({ onAction, tier = "free", content }) {
  if (tier === "free") return null;

  const actionsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!actionsRef.current) return;

      if (!actionsRef.current.contains(e.target)) {
        const el = actionsRef.current;
        if (el) el.style.display = "none";
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const actions = [
    { id: "analyze", label: "Analyze", prompt: "Analyze the following response:" },
    { id: "shorter", label: "Shorter", prompt: "Rewrite the following response in a shorter form:" },
    { id: "longer", label: "Longer", prompt: "Expand the following response with more detail:" },
    { id: "summarize", label: "Summarize", prompt: "Summarize the following response:" },
  ];

  return (
    <div className="cipher-quick-actions" ref={actionsRef}>
      {actions.map((a) => (
        <button key={a.id} onClick={() => onAction(`${a.prompt}\n\n${content}`)}>
          {a.label}
        </button>
      ))}
    </div>
  );
}
