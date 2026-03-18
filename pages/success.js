export default function Success() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#0a0a12",
      color: "white",
      textAlign: "center"
    }}>
      <h1>🚀 Welcome to Cipher Pro</h1>
      <p>Your subscription is active.</p>

      <button
        onClick={() => (window.location.href = "/")}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          borderRadius: 8,
          background: "#9d7bff",
          border: "none",
          color: "white",
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        Enter Cipher
      </button>
    </div>
  );
}
