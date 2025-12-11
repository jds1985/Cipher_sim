import { useState } from "react";
import Drawer from "./RightDrawer";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Cipher AI</h1>

      <div style={styles.menuIcon} onClick={() => setOpen(true)}>
        ☰
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} />
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
    fontSize: "26px",
    cursor: "pointer",
  },
};
