// components/chat/HeaderMenu.jsx
import { styles } from "./ChatStyles";
import { formatRemaining } from "./decipherCooldown";

export default function HeaderMenu({
  title,
  onOpenDrawer,          // 🔥 NEW: open slide-out drawer
  onReset,
  onDecipher,
  decipherRemaining,
}) {
  return (
    <div style={styles.header}>
      <span>{title}</span>

      {/* ☰ Drawer Trigger */}
      <button
        style={styles.menuBtn}
        onClick={onOpenDrawer}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Optional quick Decipher access (kept here on purpose) */}
      <button
        style={{
          ...styles.decipherBtn,
          opacity: decipherRemaining > 0 ? 0.55 : 1,
          cursor: decipherRemaining > 0 ? "not-allowed" : "pointer",
        }}
        disabled={decipherRemaining > 0}
        onClick={() => {
          if (decipherRemaining > 0) return;
          onDecipher();
        }}
        title={
          decipherRemaining > 0
            ? `Decipher cooling down: ${formatRemaining(decipherRemaining)}`
            : "Blunt / dark-humor mode (one reply)"
        }
      >
        Decipher
        {decipherRemaining > 0 && (
          <span style={styles.cooldownText}>
            {" "}
            ({formatRemaining(decipherRemaining)})
          </span>
        )}
      </button>
    </div>
  );
}
