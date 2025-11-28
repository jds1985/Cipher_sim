// components/ProfilePanel.js
// Cipher Menu / Profile Panel (with Store entry + Theme support)

export default function ProfilePanel({
  profile,
  loading,
  onClose,
  onProfileChange,
  onOpenStore, // new optional prop
}) {
  if (loading || !profile) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          zIndex: 99,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "88%",
          maxWidth: 430,
          height: "100vh",
          background: "rgba(10,20,35,0.96)",
          backdropFilter: "blur(14px)",
          borderLeft: "1px solid rgba(148,163,184,0.45)",
          boxShadow: "0 0 40px rgba(15,23,42,0.9)",
          zIndex: 100,
          color: "#fff",
          padding: 20,
          overflowY: "auto",
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 0%, #38bdf8, #6366f1 70%)",
                boxShadow: "0 0 16px rgba(56,189,248,0.7)",
              }}
            />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                Cipher Menu
              </h2>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                User ID: {profile.userId || "guest_default"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              fontSize: 22,
              color: "#e5e7eb",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* STORE BUTTON */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={onOpenStore}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(251,191,36,0.8)",
              background:
                "radial-gradient(circle at 0 0, rgba(251,191,36,0.25), rgba(15,23,42,1))",
              color: "#fde68a",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <span>🛒</span>
            <span>Store</span>
          </button>
        </div>

        {/* DISPLAY NAME */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, opacity: 0.7 }}>DISPLAY NAME</label>
          <input
            type="text"
            placeholder="How should Cipher address you?"
            value={profile.displayName || ""}
            onChange={(e) =>
              onProfileChange({ displayName: e.target.value || "" })
            }
            style={{
              width: "100%",
              marginTop: 8,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(148,163,184,0.7)",
              color: "#fff",
              fontSize: 15,
            }}
          />
        </div>

        {/* TONE SELECTOR */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, opacity: 0.7 }}>CIPHER TONE</label>
          <select
            value={profile.cipherTone || "steady"}
            onChange={(e) => onProfileChange({ cipherTone: e.target.value })}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "12px",
              borderRadius: 10,
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(148,163,184,0.7)",
              color: "#fff",
            }}
          >
            <option value="steady">Steady & Grounded</option>
            <option value="warm">Warm & Supportive</option>
            <option value="direct">Direct & Efficient</option>
            <option value="creative">Creative & Exploratory</option>
            <option value="mystic">Mystic & Symbolic</option>
          </select>
        </div>

        {/* DEPTH LEVEL */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, opacity: 0.7 }}>DEPTH LEVEL</label>
          <input
            type="range"
            min={1}
            max={10}
            value={profile.depth || 5}
            onChange={(e) => onProfileChange({ depth: Number(e.target.value) })}
            style={{ width: "100%", marginTop: 10 }}
          />
        </div>

        {/* CREATIVITY */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, opacity: 0.7 }}>CREATIVITY</label>
          <input
            type="range"
            min={1}
            max={10}
            value={profile.creativity || 5}
            onChange={(e) =>
              onProfileChange({ creativity: Number(e.target.value) })
            }
            style={{ width: "100%", marginTop: 10 }}
          />
        </div>

        {/* THEME SELECTOR (still here as quick access) */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, opacity: 0.7 }}>VISUAL THEME</label>
          <select
            value={profile.currentTheme || "cipher_core"}
            onChange={(e) =>
              onProfileChange({ currentTheme: e.target.value || "cipher_core" })
            }
            style={{
              width: "100%",
              marginTop: 8,
              padding: "12px",
              borderRadius: 10,
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(148,163,184,0.7)",
              color: "#fff",
            }}
          >
            <option value="cipher_core">Cipher Core (Blue / Navy)</option>
            <option value="nebula_purple">Nebula Purple</option>
            <option value="midnight_glass">Midnight Glass</option>
            <option value="sunset_amber">Sunset Amber</option>
          </select>
        </div>

        {/* STRICTNESS */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 13, opacity: 0.7 }}>
            GROUNDING / STRICTNESS
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={profile.strictness || 5}
            onChange={(e) =>
              onProfileChange({ strictness: Number(e.target.value) })
            }
            style={{ width: "100%", marginTop: 10 }}
          />
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
            Higher values keep Cipher more cautious and stabilizing.
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            opacity: 0.6,
            textAlign: "center",
          }}
        >
          Changes save automatically. This is your control room.
        </div>
      </div>
    </>
  );
}
