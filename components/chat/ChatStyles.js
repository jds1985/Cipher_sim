// components/chat/ChatStyles.js

// ⚠️ IMPORTANT
// This file no longer controls layout.
// The global cipher-theme.css is now the boss.
// These are only tiny helpers left for compatibility.

export const styles = {
  wrap: {
    color: "white",
  },

  /* ===============================
     HEADER
  ================================= */
  header: {},

  menuBtn: {},

  /* ===============================
     CHAT
  ================================= */
  chat: {},

  /* ===============================
     INPUT
  ================================= */
  inputWrap: {},

  input: {},

  sendBtn: {},
};

/* ===============================
   Sticky note system (kept)
================================ */

export const noteStyles = {
  wrap: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    pointerEvents: "none",
  },
  note: {
    pointerEvents: "auto",
    position: "absolute",
    top: 70,
    right: 18,
    width: 220,
    height: 220,
    padding: "26px 18px 20px",
    background: "#FFF4B5",
    color: "#1a1a1a",
    fontFamily: "'Comic Sans MS', 'Bradley Hand', cursive",
    fontSize: 15,
    borderRadius: 3,
    transform: "rotate(-2deg)",
    boxShadow: "0 20px 28px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
  },
  glue: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0))",
  },
  body: { whiteSpace: "pre-wrap", lineHeight: 1.45 },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: "auto",
  },
  primary: {
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondary: {
    background: "transparent",
    border: "none",
    color: "rgba(0,0,0,0.5)",
    padding: "6px 8px",
    cursor: "pointer",
    fontWeight: 600,
  },
};
