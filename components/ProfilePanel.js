export default function ProfilePanel({ userId, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "85%",
        maxWidth: 360,
        height: "100vh",
        background: "#ffffff",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.25)",
        padding: 20,
        zIndex: 99999,
        overflowY: "auto",
        transition: "all 0.3s ease",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Your Profile</h2>

      <p style={{ fontStyle: "italic" }}>User ID: {userId}</p>

      <p>Profile system is active and connected to Firestore.</p>

      <button
        onClick={onClose}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "#1e73be",
          color: "white",
          borderRadius: 8,
          border: "none",
          width: "100%",
        }}
      >
        Close
      </button>
    </div>
  );
}
