export default function AutonomyToggle({ value = false, onChange }) {
  return (
    <label style={{
      display: "flex",
      gap: "8px",
      alignItems: "center",
      cursor: "pointer"
    }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      Autonomy Enabled
    </label>
  );
}