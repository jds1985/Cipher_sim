// components/chat/DrawerStyles.js

export const drawerStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9998,
  },

  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 320,
    height: "100%",
    background: "linear-gradient(180deg,#0a0f2a,#05050b)",
    color: "white",
    padding: 20,
    boxShadow: "-12px 0 40px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1.2,
  },

  close: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },

  value: {
    fontSize: 15,
    fontWeight: 600,
  },

  coinRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  coin: {
    fontSize: 18,
  },

  actionPrimary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#6b7cff,#9b6bff)",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  actionSecondary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },

  footerHint: {
    marginTop: "auto",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.4,
  },
};
