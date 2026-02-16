import { useEffect } from "react";

export default function DrawerMenu({
  open,
  onClose,
  cipherCoin = 0,
  onInvite,
  onOpenStore,
}) {
  useEffect(() => {
    if (open) {
      console.log("📂 DRAWER MOUNTED");
    }
  }, [open]);

  if (!open) return null;

  // close with ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className="cipher-drawer-overlay"
        onClick={onClose}
        style={{ zIndex: 20000 }}
      />

      {/* Drawer */}
      <div
        className="cipher-drawer"
        style={{ zIndex: 20001 }}
      >
        {/* Header */}
        <div className="cipher-drawer-header">
          <div>CIPHER MENU</div>
          <button onClick={onClose} className="cipher-drawer-close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="cipher-drawer-body">
          {/* Coin */}
          <div className="cipher-coin">
            <span>🪙</span>
            <div>
              <div className="cipher-coin-label">Cipher Coin</div>
              <div className="cipher-coin-value">{cipherCoin}</div>
            </div>
          </div>

          {/* Actions */}
          <button className="cipher-drawer-btn" onClick={onInvite}>
            Invite + Earn
          </button>

          <button
            className="cipher-drawer-btn cipher-drawer-btn-primary"
            onClick={onOpenStore}
          >
            Open Store
          </button>
        </div>
      </div>
    </>
  );
}
