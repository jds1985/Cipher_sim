export default function AutonomyToggle({ value = false, onChange }) {
  return (
    <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      Autonomy
    </label>
  );
}