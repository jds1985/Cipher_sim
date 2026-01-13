// components/chat/DrawerMenu.js
export default function DrawerMenu({
  open,
  onClose,
  cipherCoin,
  onOpenStore,
}) {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Profile</h2>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

        {/* Account */}
        <div style={styles.section}>
          <div style={styles.label}>Account</div>
          <div style={styles.value}>Guest</div>
        </div>

        {/* Cipher Coin (read-only) */}
        <div style={styles.section}>
          <div style={styles.label}>Cipher Coin</div>
          <div style={styles.coinRow}>
            <span style={styles.coinIcon}>🪙</span>
            <span style={styles.coinAmount}>{cipherCoin}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.primaryButton} onClick={onOpenStore}>
            Open Store
          </button>

          <button style={styles.secondaryButton}>
            How Cipher Coin works
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
================================ */

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 320,
    height: "100%",
    background: "linear-gradient(180deg,#060b2a,#040616)",
    padding: 20,
    color: "white",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
  },
  close: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 20,
    cursor: "pointer",
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: 600,
  },
  coinRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 18,
    fontWeight: 700,
  },
  coinIcon: {
    fontSize: 22,
  },
  coinAmount: {
    fontSize: 20,
  },
  actions: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  primaryButton: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: "#7c7cff",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "white",
    opacity: 0.85,
    cursor: "pointer",
  },
};
