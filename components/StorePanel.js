// components/StorePanel.js
// Cipher Store — Futuristic Glass UI (Theme Preview MVP)

const themeList = [
  {
    key: "cipher_core",
    name: "Cipher Core",
    tag: "Default • Blue / Navy",
    description: "The standard Cipher environment. Stable, focused, and clear.",
  },
  {
    key: "nebula_purple",
    name: "Nebula Purple",
    tag: "Cosmic • Dreamy",
    description: "Soft purple nebula glow — feels like talking to Cipher in orbit.",
  },
  {
    key: "midnight_glass",
    name: "Midnight Glass",
    tag: "Sleek • Minimal",
    description: "Dark glass panels with subtle cyan accents for deep work sessions.",
  },
  {
    key: "sunset_amber",
    name: "Sunset Amber",
    tag: "Warm • Ember",
    description: "Burnt orange and ember tones for late-night reflection mode.",
  },
];

export default function StorePanel({
  currentThemeKey,
  onClose,
  onPreviewTheme,
  onApplyTheme,
}) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(10px)",
          zIndex: 150,
        }}
      />

      {/* Store Panel */}
      <div
        style={{
          position: "fixed",
          inset: "6% 4% auto 4%",
          bottom: "6%",
          zIndex: 160,
          borderRadius: 20,
          background:
            "radial-gradient(circle at 0 0, rgba(59,130,246,0.3), rgba(15,23,42,0.98))",
          border: "1px solid rgba(148,163,184,0.7)",
          boxShadow:
            "0 0 40px rgba(37,99,235,0.75), 0 0 80px rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          padding: 18,
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Cipher
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Store
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.7)",
              background: "rgba(15,23,42,0.85)",
              color: "#e5e7eb",
              padding: "6px 12px",
              fontSize: 14,
            }}
          >
            Close
          </button>
        </div>

        {/* Section title */}
        <div
          style={{
            fontSize: 13,
            opacity: 0.7,
            marginBottom: 12,
          }}
        >
          Live Theme Preview — tap Preview to see Cipher change instantly. Tap
          Use Theme to lock it in.
        </div>

        {/* Theme Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
          }}
        >
          {themeList.map((t) => {
            const isActive = currentThemeKey === t.key;
            return (
              <div
                key={t.key}
                style={{
                  borderRadius: 16,
                  padding: 12,
                  background: isActive
                    ? "linear-gradient(145deg, rgba(59,130,246,0.35), rgba(15,23,42,0.95))"
                    : "rgba(15,23,42,0.9)",
                  border: isActive
                    ? "1px solid rgba(59,130,246,0.9)"
                    : "1px solid rgba(30,64,175,0.7)",
                  boxShadow: isActive
                    ? "0 0 24px rgba(59,130,246,0.9)"
                    : "0 0 14px rgba(15,23,42,0.9)",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#93c5fd",
                    marginBottom: 6,
                  }}
                >
                  {t.tag}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 10,
                  }}
                >
                  {t.description}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => onPreviewTheme && onPreviewTheme(t.key)}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.7)",
                      background: "rgba(15,23,42,0.85)",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onApplyTheme && onApplyTheme(t.key)}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "none",
                      background: isActive ? "#10b981" : "#3b82f6",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {isActive ? "Using" : "Use Theme"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
