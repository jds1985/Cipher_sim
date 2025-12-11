// components/ui/Header.jsx
// Cipher Header 2.0 – Minimal + Menu Trigger

export default function Header({ onMenuClick }) {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Cipher AI</h1>

      <button style={styles.menuBtn} onClick={onMenuClick}>
        ☰
      </button>
    </header>
  );
}

const styles = {
  header: {
    width: "100%",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    color: "white",
    fontSize: "22px",
    position: "relative",
    zIndex: 10000,
  },
  title: {
    margin: 0,
    fontWeight: "700",
  },
  menuBtn: {
    fontSize: "28px",
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    userSelect: "none",
  },
};
