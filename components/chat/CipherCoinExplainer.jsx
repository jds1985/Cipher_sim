import { useEffect } from "react";

export default function CipherCoinExplainer({ open, onClose }) {
  if (!open) return null;

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>Cipher Coin</span>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          <p>
            Cipher Coin is a reward for helping Cipher grow.
          </p>

          <ul>
            <li>Invite friends → earn coins</li>
            <li>Future perks unlock with balance</li>
            <li>No crypto. No wallets. Just in-app credit.</li>
          </ul>

          <p style={styles.muted}>
            Early adopters will benefit the most.
          </p>
        </div>

        <button style={styles.cta} onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    width: 320,
    background: "linear-gradient(180deg,#0d1238,#06060d)",
    color: "white",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 700,
    letterSpacing: 1,
  },
  close: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  body: {
    fontSize: 14,
    lineHeight: 1.45,
  },
  muted: {
    opacity: 0.6,
    fontSize: 13,
  },
  cta: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
};
