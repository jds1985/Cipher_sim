// components/chat/HeaderMenu.jsx

export default function HeaderMenu({
  title,
  onOpenDrawer,
}) {
  return (
    <div className="cipher-header">
      <span className="cipher-title">{title}</span>

      <button
        className="cipher-menu-btn"
        onClick={onOpenDrawer}
        aria-label="Open menu"
      >
        ☰
      </button>
    </div>
  );
}
