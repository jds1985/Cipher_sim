import { useEffect, useState } from "react";

export default function CipherNote({
  note,        // { message, header? }
  onOpen,      // () => void
  onDismiss,   // () => void
}) {
  const [visible, setVisible] = useState(false);
  const header = note?.header || "Cipher noticed some space.";

  useEffect(() => {
    if (note?.message) setVisible(true);
  }, [note?.message]);

  if (!note?.message || !visible) return null;

  return (
    <div style={styles.wrap} aria-live="polite">
      <div style={styles.note}>
        <div style={styles.header}>{header}</div>
        <div style={styles.body}>{note.message}</div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, ...styles.primary }}
            onClick={() => {
              setVisible(false);
              onOpen?.();
            }}
          >
            Open chat
          </button>

          <button
            style={{ ...styles.btn, ...styles.secondary }}
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 9999,
  },
  note: {
    pointerEvents: "auto",
    position: "absolute",
    top: 88,
    right: 18,
    width: 320,
    maxWidth: "calc(100vw - 36px)",
    padding: 16,
    borderRadius: 14,
    background: "rgba(255, 244, 181, 0.98)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    transform: "rotate(-1.5deg)",
    border: "1px solid rgba(0,0,0,0.08)",
    backdropFilter: "blur(2px)",
  },
  header: {
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  body: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
    fontSize: 15,
    marginBottom: 14,
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  btn: {
    borderRadius: 10,
    padding: "10px 12px",
    border: "1px solid rgba(0,0,0,0.12)",
    cursor: "pointer",
    fontWeight: 600,
  },
  primary: {
    background: "rgba(0,0,0,0.9)",
    color: "white",
  },
  secondary: {
    background: "rgba(255,255,255,0.75)",
    color: "rgba(0,0,0,0.85)",
  },
};
