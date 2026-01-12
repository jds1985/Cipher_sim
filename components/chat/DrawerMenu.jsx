// components/chat/DrawerMenu.jsx
import { styles } from "./ChatStyles";

export default function DrawerMenu({
  open,
  onClose,
  cipherCoin = 0,
  email = null,

  // 🔌 optional hooks (safe)
  onOpenStore,
  onInvite,
  onExplainCoin,
}) {
  if (!open) return null;

  return (
    <div style={drawerStyles.overlay} onClick={onClose}>
      <div
        style={drawerStyles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={drawerStyles.header}>
          <span style={drawerStyles.title}>Profile</span>
          <button style={drawerStyles.close} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ACCOUNT */}
        <div style={drawerStyles.section}>
          <div style={drawerStyles.label}>Account</div>
          <div style={drawerStyles.value}>
            {email || "Guest"}
          </div>
        </div>

        {/* CIPHER COIN */}
        <div style={drawerStyles.section}>
          <div style={drawerStyles.label}>Cipher Coin</div>
          <div style={drawerStyles.coinRow}>
            <span style={drawerStyles.coin}>🪙</span>
            <span style={drawerStyles.value}>{cipherCoin}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={drawerStyles.section}>
          <button
            style={drawerStyles.action}
            onClick={() => onInvite?.()}
          >
            Invite friends (earn coins)
          </button>

          <button
            style={drawerStyles.actionSecondary}
            onClick={() => onExplainCoin?.()}
          >
            How Cipher Coin works
          </button>

          {/* 🛒 STORE (RESTORED + WIRED) */}
          <button
            style={drawerStyles.actionSecondary}
            onClick={() => onOpenStore?.()}
          >
            Open Store
          </button>
        </div>
      </div>
    </div>
  );
}

const drawerStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9998,
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 300,
    height: "100%",
    background: "linear-gradient(180deg,#0a0f2a,#05050b)",
    color: "white",
    padding: 18,
    boxShadow: "-10px 0 30px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
  },
  close: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 15,
    fontWeight: 600,
  },
  coinRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  coin: {
    fontSize: 18,
  },
  action: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  actionSecondary: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
};
