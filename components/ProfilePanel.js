// components/ProfilePanel.js
// Cipher Futuristic Side Menu

export default function ProfilePanel({
  profile,
  loading,
  onClose,
  onProfileChange,
}) {
  const p = profile || {};

  const handleChange = (field, value) => {
    if (!onProfileChange) return;
    onProfileChange({ [field]: value });
  };

  return (
    <>
      {/* Dark overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 999,
        }}
      />

      {/* Right-side panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "85vw",
          maxWidth: 380,
          zIndex: 1000,
          background:
            "linear-gradient(145deg, #050816 0%, #101826 40%, #111827 100%)",
          borderLeft: "1px solid rgba(147, 197, 253, 0.35)",
          boxShadow: "0 0 40px rgba(56,189,248,0.45)",
          color: "#e5e7eb",
          padding: "18px 18px 28px 18px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              background:
                "radial-gradient(circle at 30% 0%, #38bdf8, #6366f1 60%, #0f172a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
              boxShadow: "0 0 18px rgba(56,189,248,0.7)",
              fontSize: 18,
            }}
          >
            ⭕
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              Cipher Menu
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 2,
              }}
            >
              User ID: {p.id || "guest_default"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              fontSize: 18,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading profile…</div>
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {/* Tier */}
            <section style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Access Tier
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(251,191,36,0.5)",
                  background:
                    "radial-gradient(circle at 0 0, rgba(251,191,36,0.15), transparent 60%)",
                  fontSize: 12,
                  color: "#fbbf24",
                }}
              >
                {String(p.tier || "free").toUpperCase()}
              </div>
            </section>

            {/* Display name */}
            <section style={{ marginBottom: 18 }}>
              <label
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 4,
                  display: "block",
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                placeholder="How should Cipher address you?"
                value={p.displayName || ""}
                onChange={(e) =>
                  handleChange("displayName", e.target.value || null)
                }
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.5)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: 13,
                }}
              />
            </section>

            {/* Tone */}
            <section style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Cipher Tone
              </div>
              <select
                value={p.tone || "steady"}
                onChange={(e) => handleChange("tone", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.5)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: 13,
                }}
              >
                <option value="steady">Steady & Grounded</option>
                <option value="warm">Warm & Reassuring</option>
                <option value="direct">Direct & Clear</option>
              </select>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 4,
                }}
              >
                Controls how emotionally expressive Cipher is allowed to be.
              </div>
            </section>

            {/* Depth Level */}
            <section style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Depth Level
              </div>
              <input
                type="range"
                min={1}
                max={3}
                value={p.depthLevel ?? 1}
                onChange={(e) =>
                  handleChange("depthLevel", Number(e.target.value))
                }
                style={{ width: "100%" }}
              />
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                {p.depthLevel === 1 && "Surface: quick, light responses."}
                {p.depthLevel === 2 &&
                  "Deep Dive: more reflection and linking past chats."}
                {p.depthLevel === 3 &&
                  "Core Mode: longest, most detailed reasoning allowed."}
              </div>
            </section>

            {/* Creativity */}
            <section style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Creativity
              </div>
              <input
                type="range"
                min={0}
                max={2}
                value={p.creativity ?? 1}
                onChange={(e) =>
                  handleChange("creativity", Number(e.target.value))
                }
                style={{ width: "100%" }}
              />
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                {p.creativity === 0 && "Low: factual, minimal embellishment."}
                {p.creativity === 1 && "Balanced: practical with some ideas."}
                {p.creativity === 2 && "High: more speculative and creative."}
              </div>
            </section>

            {/* Theme */}
            <section style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Visual Theme
              </div>
              <select
                value={p.currentTheme || "cipher_core"}
                onChange={(e) => handleChange("currentTheme", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.5)",
                  background: "rgba(15,23,42,0.9)",
                  color: "#e5e7eb",
                  fontSize: 13,
                }}
              >
                <option value="cipher_core">Cipher Core (blue / navy)</option>
                <option value="nebula_purple">Nebula Purple</option>
                <option value="midnight_glass">Midnight Glass</option>
                <option value="sunset_amber">Sunset Amber</option>
              </select>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 4,
                }}
              >
                Later we can have Liz design full background packs for these.
              </div>
            </section>

            {/* Strictness (safety / grounding feel) */}
            <section style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Grounding / Strictness
              </div>
              <input
                type="range"
                min={0}
                max={2}
                value={p.strictness ?? 1}
                onChange={(e) =>
                  handleChange("strictness", Number(e.target.value))
                }
                style={{ width: "100%" }}
              />
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Higher values keep Cipher more cautious and stabilizing.
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          Changes save automatically. This is your control room.
        </div>
      </div>
    </>
  );
}
