export default function Store() {
  const items = [
    { name: "Obsidian Theme", category: "Themes" },
    { name: "Void UI Skin", category: "UI Skins" },
    { name: "Neon Intent Ring", category: "Intent Ring Skins" },
    { name: "Shadow Cat", category: "Pets" },
    { name: "Glass Prototype", category: "Experimental" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.glass}>
        <h1 style={styles.title}>Cipher Store</h1>
        <p style={styles.subtitle}>
          Customizations, interfaces, and experimental upgrades.
        </p>

        <div style={styles.grid}>
          {items.map((item, index) => (
            <div key={index} style={styles.card}>
              <div>
                <h3 style={styles.itemName}>{item.name}</h3>
                <p style={styles.category}>{item.category}</p>
              </div>

              <button style={styles.button} disabled>
                Locked
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES (Dark Glass)
================================ */

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #1b1f2a 0%, #0b0e14 60%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "60px 20px",
    color: "#e6e6eb",
  },
  glass: {
    width: "100%",
    maxWidth: "1100px",
    background: "rgba(20, 24, 36, 0.6)",
    backdropFilter: "blur(14px)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  title: {
    fontSize: "32px",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "14px",
    opacity: 0.7,
    marginBottom: "28px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "rgba(12, 14, 22, 0.7)",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "140px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  itemName: {
    fontSize: "16px",
    marginBottom: "6px",
  },
  category: {
    fontSize: "12px",
    opacity: 0.6,
  },
  button: {
    marginTop: "16px",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: "#aaa",
    cursor: "not-allowed",
  },
};
