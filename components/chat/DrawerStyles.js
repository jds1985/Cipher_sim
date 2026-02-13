export const drawerStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
  },

  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 320,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    padding: 20,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontWeight: 700,
    cursor: "pointer",
  },

  actionSecondary: {
    padding: "12px 14px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
  },

  footerHint: {
    marginTop: "auto",
    fontSize: 12,
    lineHeight: 1.4,
  },
};
