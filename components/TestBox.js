import { useState } from "react";

export default function TestBox({
  title = "TestBox",
  children
}) {
  const [active, setActive] = useState(false);

  return (
    <div style={{
      padding: "20px",
      border: "1px solid #0f0",
      background: "#000",
      color: "#0f0",
      fontFamily: "monospace"
    }}>
      <h3>{title}</h3>

      <button
        onClick={() => setActive(!active)}
        style={{
          background: "#000",
          color: "#0f0",
          border: "1px solid #0f0",
          padding: "6px 10px",
          cursor: "pointer"
        }}
      >
        {active ? "Deactivate" : "Activate"}
      </button>

      {active && (
        <div style={{ marginTop: "12px" }}>
          {children || "Component active."}
          "patched successfully"
        </div>
      )}
    </div>
  );
}