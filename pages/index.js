export default function Chat() {
  return (
    <div style={{
      background: "#000",
      color: "#0f0",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "monospace"
    }}>
      <h1>CIPHER CHAT</h1>

      <div style={{
        border: "1px solid #0f0",
        padding: "10px",
        height: "60vh",
        overflowY: "auto",
        marginBottom: "10px"
      }}>
        <p>&gt; System online.</p>
        <p>&gt; Awaiting input...</p>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <textarea
          placeholder="Type message..."
          style={{
            flex: 1,
            background: "#000",
            color: "#0f0",
            border: "1px solid #0f0",
            padding: "10px"
          }}
        />
        <button style={{
          background: "#0f0",
          color: "#000",
          fontWeight: "bold",
          padding: "10px 20px"
        }}>
          SEND
        </button>
      </div>
    </div>
  );
}