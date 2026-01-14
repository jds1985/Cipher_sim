// components/chat/HeaderMenu.jsx
import { styles } from "./ChatStyles";

export default function HeaderMenu({
  title,
  onOpenDrawer, // ☰ drawer toggle only
}) {
  return (
    <div style={styles.header}>
      {/* Title / Mode label */}
      <span>{title}</span>

      {/* ☰ Drawer Trigger */}
      <button
        style={styles.menuBtn}
        onClick={onOpenDrawer}
        aria-label="Open menu"
      >
        ☰
      </button>
    </div>
  );
}
