import { useState, useRef, useEffect } from "react";

export default function CipherDropdown({
  label = "Select Option",
  options = [],
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ marginBottom: 20, width: "100%" }}>
      {/* LABEL */}
      <div
        style={{
          fontSize: 12,
          color: "#94a3b8",
          marginBottom: 6,
          letterSpacing: 0.4,
        }}
      >
        {label.toUpperCase()}
      </div>

      {/* BUTTON */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "14px 16px",
          background: "rgba(15,23,42,0.6)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {current?.preview && (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: current.preview,
                boxShadow: "0 0 8px rgba(255,255,255,0.4)",
              }}
            />
          )}
          <span>{current?.label || "Select…"}</span>
        </div>

        <span style={{ fontSize: 14, opacity: 0.8 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* OPTIONS PANEL */}
      {open && (
        <div
          style={{
            marginTop: 6,
            background: "rgba(10,15,28,0.92)",
            backdropFilter: "blur(12px)",
            borderRadius: 12,
            padding: "8px 0",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            animation: "dropdownFade 0.18s ease",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#e2e8f0",
                cursor: "pointer",
                background:
                  value === opt.value ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              {opt.preview && (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: opt.preview,
                    boxShadow:
                      value === opt.value
                        ? "0 0 10px rgba(255,255,255,0.6)"
                        : "none",
                  }}
                />
              )}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
