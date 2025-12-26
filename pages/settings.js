export default function Settings() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Settings</h1>
      <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input type="checkbox" />
        Autonomy Enabled
      </label>
    </div>
  );
}