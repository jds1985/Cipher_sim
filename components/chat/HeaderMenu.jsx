export default function HeaderMenu({ title = "CIPHER", onOpenDrawer, onNewChat }) {
  console.log("🟢 HEADER COMPONENT RENDERED");

  return (
    <header className="cipher-header">
      {/* LEFT SIDE → LOGO */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          src="/logo.png"
          alt="Cipher"
          style={{
            height: 38,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* RIGHT SIDE → BUTTONS */}
      <div style={{ display: "flex", gap: 10 }}>
        {onNewChat && (
          <button className="cipher-btn-secondary" onClick={onNewChat}>
            New
          </button>
        )}

        <button className="cipher-btn-primary" onClick={onOpenDrawer}>
          Menu
        </button>
      </div>
    </header>
  );
}
