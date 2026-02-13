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
    top: 80,
    right: 18,
    width: 260,
    padding: "18px 16px",
    borderRadius: 16,

    backdropFilter: "blur(18px)",
    background: "rgba(10, 12, 20, 0.85)",
    border: "1px solid rgba(0,255,200,0.25)",

    boxShadow:
      "0 0 20px rgba(0,255,200,0.18), inset 0 0 14px rgba(0,255,200,0.05)",

    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  glue: {
    position: "absolute",
    top: -6,
    left: 20,
    width: 40,
    height: 6,
    borderRadius: 999,
    background: "linear-gradient(90deg,#6b7cff,#00ffc8)",
    boxShadow: "0 0 10px rgba(0,255,200,0.8)",
  },

  body: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.45,
    fontSize: 14,
  },

  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 4,
  },

  primary: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6b7cff,#00ffc8)",
    color: "black",
    fontWeight: 700,
    cursor: "pointer",
  },

  secondary: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
};
