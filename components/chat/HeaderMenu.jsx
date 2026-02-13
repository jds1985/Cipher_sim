// components/chat/HeaderMenu.jsx

export default function HeaderMenu({ title, onOpenDrawer }) {
  return (
    <div className="cipher-header">
      <div className="cipher-title">{title}</div>

      <button
        className="cipher-menu-btn"
        onClick={onOpenDrawer}
        aria-label="Open menu"
        type="button"
      >
        ☰
      </button>
    </div>
  );
}
