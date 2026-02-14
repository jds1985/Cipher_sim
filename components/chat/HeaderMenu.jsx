export default function HeaderMenu({ title = "CIPHER", onOpenDrawer, onNewChat }) {
  console.log("🟢 HEADER COMPONENT RENDERED");

  return (
    <header className="cipher-header">
      <div style={{ fontWeight: 700 }}>{title}</div>

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
