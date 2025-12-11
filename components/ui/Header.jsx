// components/Header.jsx
// Cipher Header 2.0 – Minimal + Menu Trigger

export default function Header({ onMenuClick }) {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Cipher AI</h1>

      <div style={styles.menuIcon} onClick={onMenuClick}>
        ☰
      </div>
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
    fontSize: "20px",
  },
  title: {
    margin: 0,
    fontWeight: "600",
  },
  menuIcon: {
    fontSize: "28px",
    cursor: "pointer",
    userSelect: "none",
  },
};
