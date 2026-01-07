// components/chat/ChatStyles.js

export const styles = {
  wrap: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    color: "white",
    background:
      "radial-gradient(1200px 600px at 50% -100px, rgba(167,115,255,0.35), rgba(5,5,12,1) 55%), radial-gradient(800px 400px at 80% 10%, rgba(120,70,255,0.18), transparent 70%), radial-gradient(800px 400px at 10% 20%, rgba(80,150,255,0.10), transparent 70%)",
  },

  // Header (purple glass)
  header: {
    padding: 18,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 3,
    textAlign: "center",
    position: "relative",
    background: "rgba(110, 70, 255, 0.10)",
    borderBottom: "1px solid rgba(190,150,255,0.18)",
    boxShadow:
      "0 0 0 1px rgba(190,150,255,0.12) inset, 0 10px 30px rgba(0,0,0,0.55)",
    backdropFilter: "blur(14px)",
  },

  // Menu button (glow)
  menuBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(190,150,255,0.22)",
    background: "rgba(25, 18, 45, 0.55)",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 0 18px rgba(167,115,255,0.18)",
  },

  // Dropdown menu (purple glass)
  menu: {
    position: "absolute",
    top: 66,
    right: 12,
    zIndex: 1000,
    minWidth: 210,
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid rgba(190,150,255,0.18)",
    background: "rgba(18, 14, 28, 0.82)",
    backdropFilter: "blur(16px)",
    boxShadow:
      "0 0 0 1px rgba(190,150,255,0.10) inset, 0 20px 45px rgba(0,0,0,0.7), 0 0 24px rgba(167,115,255,0.12)",
  },

  menuItem: {
    width: "100%",
    padding: "12px 14px",
    background: "transparent",
    border: "none",
    color: "rgba(245,245,255,0.95)",
    textAlign: "left",
    fontSize: 14,
    cursor: "pointer",
    borderBottom: "1px solid rgba(190,150,255,0.08)",
  },

  menuItemLink: {
    display: "block",
    padding: "12px 14px",
    color: "rgba(245,245,255,0.95)",
    textDecoration: "none",
    fontSize: 14,
    borderBottom: "1px solid rgba(190,150,255,0.08)",
  },

  cooldownText: { opacity: 0.65, fontSize: 12 },

  chat: {
    flex: 1,
    padding: 18,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  // Input bar container
  inputRow: {
    display: "flex",
    gap: 10,
    padding: 14,
    borderTop: "1px solid rgba(190,150,255,0.14)",
    background: "rgba(10,10,18,0.55)",
    backdropFilter: "blur(12px)",
  },

  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    padding: 12,
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(190,150,255,0.18)",
    color: "white",
    resize: "none",
    outline: "none",
    boxShadow: "0 0 0 1px rgba(167,115,255,0.08) inset",
  },

  send: {
    padding: "0 18px",
    borderRadius: 16,
    border: "1px solid rgba(190,150,255,0.22)",
    background:
      "linear-gradient(135deg, rgba(125,75,255,0.95), rgba(180,120,255,0.90))",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 0 22px rgba(167,115,255,0.22)",
  },
};

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
    background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0))",
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
