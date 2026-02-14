console.log("HEADER FILE EXECUTING");
exportt default function HeaderMenu({ title = "CIPHER", onOpenDrawer, onNewChat }) {
  return (
    <header className="cipher-header">
      <div style={{ fontWeight: 700, letterSpacing: 1 }}>
        {title}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {onNewChat && (
          <button
            className="cipher-btn-secondary"
            onClick={onNewChat}
            type="button"
          >
            New
          </button>
        )}

        <button
          className="cipher-btn-primary"
          onClick={onOpenDrawer}
          type="button"
        >
          Menu
        </button>
      </div>
    </header>
  );
}
