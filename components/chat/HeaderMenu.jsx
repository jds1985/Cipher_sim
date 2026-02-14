export default function HeaderMenu({ title, onOpenDrawer, onNewChat }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 99999,
        background: "lime",
        color: "black",
        padding: 16,
        fontWeight: "bold",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>{title}</div>

      <div style={{ display: "flex", gap: 10 }}>
        {onNewChat && (
          <button onClick={onNewChat}>New</button>
        )}
        <button onClick={onOpenDrawer}>Menu</button>
      </div>
    </div>
  );
}
