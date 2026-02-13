// components/chat/ChatStyles.js

export const styles = {
  wrap: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    color: "white",

    // ❌ REMOVE old backgrounds
    // let globals.css control visuals
    background: "transparent",
  },

  /* ===============================
     HEADER
  ================================= */
  header: {
    height: 64,
    padding: "0 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",

    background: "transparent",
    borderBottom: "none",
    boxShadow: "none",
    backdropFilter: "none",
    letterSpacing: 1,
    fontWeight: 600,
  },

  menuBtn: {
    fontSize: 18,
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },

  /* ===============================
     CHAT
  ================================= */
  chat: {
    flex: 1,
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "transparent",
  },

  /* ===============================
     INPUT
  ================================= */
  inputWrap: {
    position: "fixed",
    bottom: 0,
    width: "100%",
    padding: 18,
    background: "transparent",
    borderTop: "none",
    backdropFilter: "none",
  },

  input: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 15,
    outline: "none",
  },

  sendBtn: {
    borderRadius: 14,
    border: "none",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};

/* ===============================
   Sticky note (unchanged)
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
