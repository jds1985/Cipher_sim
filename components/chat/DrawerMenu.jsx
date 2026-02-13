// components/chat/DrawerMenu.jsx

export default function DrawerMenu({
  open,
  onClose,
  cipherCoin = 0,
  onInvite,
  onOpenStore,
}) {
  if (!open) return null;

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <div className="cipher-drawer-overlay" onClick={onClose} role="presentation">
      <div className="cipher-drawer" onClick={stop} role="dialog" aria-modal="true">
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="cipher-drawer-title">CIPHER MENU</div>
          <button className="cipher-drawer-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* Coin */}
        <div className="cipher-drawer-section">
          <div className="cipher-drawer-label">Cipher Coin</div>
          <div className="cipher-drawer-value">🪙 {cipherCoin}</div>
        </div>

        {/* Actions */}
        <button className="cipher-drawer-btn-primary" onClick={onInvite} type="button">
          Invite + Earn Coin
        </button>

        <button className="cipher-drawer-btn-secondary" onClick={onOpenStore} type="button">
          Open Store
        </button>

        <div style={{ marginTop: "auto", opacity: 0.6, fontSize: 12, lineHeight: 1.4 }}>
          Tip: Tap outside the drawer to close.
        </div>
      </div>
    </div>
  );
}
