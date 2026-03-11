// components/ProfilePanel.js
export default function ProfilePanel({
  profile,
  loading,
  onClose,
  onProfileChange,
  onOpenStore,
  onOpenDeviceLink,
  tier = "free",
}) {
  const name = profile?.displayName || "Jim";
  const voiceOn = profile?.voiceEnabled !== false; // default = true

  const tierGlyphs = {
    free: "/images/glyph_tier1.png",
    pro: "/images/glyph_tier2.png",
    builder: "/images/glyph_tier3.png",
  };

  const tierGlow = {
    free: "0 0 14px rgba(120,120,255,0.35)",
    pro: "0 0 18px rgba(0,255,200,0.45)",
    builder: "0 0 22px rgba(255,180,0,0.55)",
  };

  const glyph = tierGlyphs[tier] || tierGlyphs.free;
  const glow = tierGlow[tier] || tierGlow.free;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 420,
          background: "#020617",
          borderRadius: 18,
          padding: 20,
          color: "#e5e7eb",
          boxShadow: "0 20px 60px rgba(15,23,42,0.9)",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >

        {/* ✨ Tier Glyph Badge */}
        <div
          style={{
            position: "absolute",
            top: -12,
            right: -12,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#020617",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: glow,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <img
            src={glyph}
            alt="tier glyph"
            style={{
              width: "70%",
              height: "70%",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 20, margin: 0 }}>Cipher Settings</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "4px 10px",
              background: "#111827",
              color: "#e5e7eb",
              fontSize: 13,
            }}
          >
            ✕ Close
          </button>
        </div>

        {loading ? (
          <p style={{ fontStyle: "italic" }}>Loading profile…</p>
        ) : (
          <>
            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 0.08,
                  color: "#9ca3af",
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                defaultValue={name}
                onBlur={(e) =>
                  onProfileChange?.({ displayName: e.target.value })
                }
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                }}
              />
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                How Cipher addresses you in chat.
              </p>
            </div>

            {/* Voice Settings */}
            <div
              style={{
                marginBottom: 18,
                padding: 10,
                borderRadius: 12,
                background: "#020617",
                border: "1px solid #1f2937",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Voice Settings
                </span>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    Text chat voice
                  </span>
                  <input
                    type="checkbox"
                    checked={voiceOn}
                    onChange={() =>
                      onProfileChange?.({ voiceEnabled: !voiceOn })
                    }
                  />
                </label>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                When enabled, Cipher will speak replies from normal text chat
                using his Verse voice.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={onOpenStore}
                style={{
                  width: "100%",
                  borderRadius: 999,
                  padding: "8px 14px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #4c1d95, #7c3aed, #a855f7)",
                  color: "#f9fafb",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                🎨 Open Theme Store
              </button>

              <button
                onClick={onOpenDeviceLink}
                style={{
                  width: "100%",
                  borderRadius: 999,
                  padding: "8px 14px",
                  border: "1px solid #1f2937",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 14,
                }}
              >
                📱 Device Link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
