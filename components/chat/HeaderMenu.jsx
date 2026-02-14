// components/chat/HeaderMenu.jsx

export default function HeaderMenu({ title, onOpenDrawer, onNewChat }) {
  return (
    <div className="cipher-header">
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
    </div>
  );
}
