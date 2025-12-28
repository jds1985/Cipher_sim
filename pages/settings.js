import AutonomyToggle from "../components/AutonomyToggle";

export default function Settings() {
  return (
    <div style={{
      padding: "24px",
      background: "#000",
      color: "#0f0",
      minHeight: "100vh",
      fontFamily: "monospace"
    }}>
      <h1>Settings</h1>

      <div style={{
        marginTop: "20px",
        border: "1px solid #0f0",
        padding: "12px",
        maxWidth: "320px"
      }}>
        <AutonomyToggle />
      </div>
    </div>
  );
}