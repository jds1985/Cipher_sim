export default function DrawerMenu({ open, onClose }) {
  if (!open) return null;

  console.log("📂 Drawer rendering safely");

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 20000,
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 260,
          height: "100%",
          background: "#111",
          color: "white",
          padding: 20,
          zIndex: 20001,
        }}
      >
        <h3>Menu</h3>

        <button onClick={onClose}>Close</button>
      </div>
    </>
  );
}
