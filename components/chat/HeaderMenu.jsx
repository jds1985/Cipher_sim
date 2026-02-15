export default function HeaderMenu({ onOpenDrawer, onNewChat }) {
  console.log("🟢 HEADER COMPONENT RENDERED");

  return (
    <header className="cipher-header">
      {/* LEFT → LOGO */}
      <div className="cipher-logo-wrap">
        <img
          src="/logo.png"
          alt="Cipher OS"
          className="cipher-logo"
        />
      </div>

      {/* RIGHT → BUTTONS */}
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
