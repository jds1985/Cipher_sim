// components/ProfilePanel.js
// Cipher Menu / Profile Editor — Final Working Version

export default function ProfilePanel({
  profile,
  loading,
  onClose,
  onProfileChange,
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
          fontSize: 20,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "88%",
        maxWidth: 430,
        height: "100vh",
        background: "rgba(10,20,35,0.94)",
        backdropFilter: "blur(12px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 40px rgba(0,0,0,0.4)",
        zIndex: 200,
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
              background: "radial-gradient(circle,#ff2,#f06)",
              boxShadow: "0 0 10px rgba(255,90,90,0.6)",
            }}
          />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            Cipher Menu
          </h2>
        </div>

        <button
          onClick={onClose}
          style={{
            fontSize: 22,
            color: "#fff",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* USER ID + TIER */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, opacity: 0.6 }}>User ID:</div>
        <div style={{ fontSize: 15, marginBottom: 6 }}>{profile.userId}</div>

        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            border: "1px solid #facc15",
            borderRadius: 20,
            fontSize: 12,
            color: "#facc15",
          }}
        >
          FREE
        </div>
      </div>

      {/* DISPLAY NAME */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 13, opacity: 0.7 }}>DISPLAY NAME</label>
        <input
          type="text"
          placeholder="How should Cipher address you?"
          value={profile.displayName || ""}
          onChange={(e) => onProfileChange({ displayName: e.target.value })}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            fontSize: 15,
          }}
        />
      </div>

      {/* CIPHER TONE */}
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
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
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

      {/* ⭐ VISUAL THEME — IMPORTANT PART */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 13, opacity: 0.7 }}>VISUAL THEME</label>

        <select
          value={profile.currentTheme || "cipher_core"}
          onChange={(e) =>
            onProfileChange({ currentTheme: e.target.value })
          }
          style={{
            width: "100%",
            marginTop: 8,
            padding: "12px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
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
    </div>
  );
}
