// components/ProfilePanel.js
// Cipher Profile + Settings Panel (with Voice Toggle)

export default function ProfilePanel({
  profile,
  loading,
  onClose,
  onProfileChange,
  onOpenStore,
  voiceEnabled = true,
  onToggleVoice,
}) {
  const displayName = profile?.displayName || "Jim";
  const bio =
    profile?.bio ||
    "Architect of Cipher AI, DigiSoul, and the memory future.";

  const handleChange = (field, value) => {
    if (!onProfileChange) return;
    onProfileChange({ [field]: value });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.75)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background:
            "radial-gradient(circle at top, #111827 0%, #020617 55%, #020617 100%)",
          color: "#e5e7eb",
          borderRadius: 18,
          padding: 20,
          boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          border: "1px solid rgba(148,163,184,0.35)",
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
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            ⚙ Cipher Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p style={{ fontStyle: "italic", color: "#9ca3af" }}>
            Loading profile…
          </p>
        ) : (
          <>
            {/* Identity */}
            <section style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#9ca3af",
                  margin: "0 0 6px 0",
                }}
              >
                Profile
              </h3>

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Display name
              </label>
              <input
                type="text"
                defaultValue={displayName}
                onBlur={(e) => handleChange("displayName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                  marginBottom: 8,
                  fontSize: 14,
                }}
              />

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Bio / tagline
              </label>
              <textarea
                rows={2}
                defaultValue={bio}
                onBlur={(e) => handleChange("bio", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 13,
                  resize: "none",
                }}
              />
            </section>

            {/* Voice Settings */}
            <section style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#9ca3af",
                  margin: "0 0 6px 0",
                }}
              >
                Voice
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: "0 0 8px 0",
                }}
              >
                Control whether Cipher speaks out loud after normal text chat
                replies. Voice & Vision chat will still use audio responses.
              </p>

              <button
                onClick={onToggleVoice}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: voiceEnabled ? "#22c55e" : "#4b5563",
                  boxShadow: voiceEnabled
                    ? "0 0 18px rgba(34,197,94,0.6)"
                    : "0 0 10px rgba(75,85,99,0.7)",
                  color: "white",
                }}
              >
                {voiceEnabled ? "🔊 Voice On (text chat)" : "🔈 Voice Off"}
              </button>
            </section>

            {/* Theme / Store */}
            <section style={{ marginBottom: 10 }}>
              <h3
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#9ca3af",
                  margin: "0 0 6px 0",
                }}
              >
                Appearance
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: "0 0 8px 0",
                }}
              >
                Switch between Cipher themes and future cosmetic upgrades.
              </p>
              <button
                onClick={onOpenStore}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background:
                    "linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)",
                  color: "white",
                  boxShadow: "0 0 18px rgba(129,140,248,0.8)",
                }}
              >
                🎨 Open Theme Store
              </button>
            </section>

            {/* Footer */}
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Cipher remembers these settings locally and in your profile.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
