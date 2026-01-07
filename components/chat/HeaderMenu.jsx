// components/chat/HeaderMenu.jsx
import { styles } from "./ChatStyles";
import { formatRemaining } from "./decipherCooldown";

export default function HeaderMenu({
  title,
  menuOpen,
  setMenuOpen,
  onReset,
  onDecipher,
  decipherRemaining,
}) {
  return (
    <div style={styles.header}>
      <span>{title}</span>

      <button
        style={styles.menuBtn}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {menuOpen && (
        <div style={styles.menu}>
          <a href="/store" style={styles.menuItemLink} onClick={() => setMenuOpen(false)}>
            Store
          </a>

          <button
            style={styles.menuItem}
            onClick={() => {
              // stub: wire to theme system later
              setMenuOpen(false);
            }}
          >
            Toggle Theme
          </button>

          <button
            style={styles.menuItem}
            onClick={() => {
              // stub: wire to voice later
              setMenuOpen(false);
            }}
          >
            Voice (soon)
          </button>

          <button
            style={{
              ...styles.menuItem,
              opacity: decipherRemaining > 0 ? 0.55 : 1,
              cursor: decipherRemaining > 0 ? "not-allowed" : "pointer",
            }}
            disabled={decipherRemaining > 0}
            onClick={() => {
              if (decipherRemaining > 0) return;
              onDecipher();
              setMenuOpen(false);
            }}
            title={
              decipherRemaining > 0
                ? `Decipher cooling down: ${formatRemaining(decipherRemaining)}`
                : "Blunt / dark-humor mode (one reply)"
            }
          >
            Decipher{" "}
            {decipherRemaining > 0 && (
              <span style={styles.cooldownText}>({formatRemaining(decipherRemaining)})</span>
            )}
          </button>

          <button
            style={styles.menuItem}
            onClick={() => {
              onReset();
              setMenuOpen(false);
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
