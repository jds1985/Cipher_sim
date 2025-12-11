// components/RightDrawer.jsx
// Full-Height Right Slide-Out Menu

export default function RightDrawer({ open, onClose }) {
  return (
    <>
      {/* Backdrop */}
      {open && <div style={styles.backdrop} onClick={onClose}></div>}

      {/* Drawer */}
      <div
        style={{
          ...styles.drawer,
          right: open ? "0px" : "-80%",
        }}
      >
        <h2 style={styles.drawerTitle}>Menu</h2>

        <div style={styles.menuItem}>⚡ ShadowFlip</div>
        <div style={styles.menuItem}>🜂 Decipher</div>
        <div style={styles.menuItem}>🖥 Device</div>
        <div style={styles.menuItem}>⚙️ Settings</div>
        <div style={styles.menuItem}>✦ About Cipher</div>
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
    background: "rgba(20,20,30,0.92)",
    backdropFilter: "blur(10px)",
    color: "white",
    padding: "24px",
    boxShadow: "-4px 0 20px rgba(0,0,0,0.6)",
    transition: "right 0.25s ease",
    zIndex: 9999,
  },
  drawerTitle: {
    marginBottom: "20px",
    fontSize: "22px",
  },
  menuItem: {
    margin: "12px 0",
    fontSize: "18px",
    cursor: "pointer",
    paddingBottom: "6px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.4)",
    zIndex: 9998,
  },
};
