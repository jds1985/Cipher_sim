// components/ui/RightDrawer.jsx
// Full-Height Right Slide-Out Menu

export default function RightDrawer({ open, onClose }) {
  return (
    <>
      {/* Black overlay / backdrop */}
      {open && <div style={styles.backdrop} onClick={onClose}></div>}

      {/* Slide-out drawer */}
      <div
        style={{
          ...styles.drawer,
          right: open ? "0px" : "-320px",
        }}
      >
        <button style={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2 style={styles.drawerTitle}>Menu</h2>

        <button style={styles.menuItem}>⚡ ShadowFlip</button>
        <button style={styles.menuItem}>△ Decipher</button>
        <button style={styles.menuItem}>🖥 Device</button>
        <button style={styles.menuItem}>⚙ Settings</button>
        <button style={styles.menuItem}>✦ About Cipher</button>
      </div>
    </>
  );
}

const styles = {
  drawer: {
    position: "fixed",
    top: 0,
    height: "100vh",
    width: "80%",
    maxWidth: "300px",
    background: "rgba(18, 18, 25, 0.98)",
    backdropFilter: "blur(8px)",
    color: "white",
    padding: "24px 16px",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.6)",
    transition: "right 0.28s ease",
    zIndex: 9999999,
    display: "flex",
    flexDirection: "column",
  },
  closeBtn: {
    alignSelf: "flex-end",
    fontSize: "22px",
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    marginBottom: "12px",
  },
  drawerTitle: {
    margin: 0,
    marginBottom: "18px",
    fontSize: "24px",
    fontWeight: "600",
  },
  menuItem: {
    textAlign: "left",
    fontSize: "18px",
    padding: "10px 0",
    border: "none",
    background: "none",
    color: "white",
    cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    marginBottom: "8px",
  },
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.35)",
    zIndex: 9999998,
  },
};
