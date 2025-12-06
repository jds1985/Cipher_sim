// pages/test_autonomy.js

export default function TestAutonomy() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🧪 Cipher Autonomy Test</h1>
      <p>Run the v8 autonomy engine below.</p>

      {/* Input box */}
      <textarea
        id="autonomy-note"
        placeholder="Enter a note for Cipher Autonomy v8..."
        style={{
          width: "100%",
          height: "120px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "15px",
          fontSize: "16px"
        }}
      ></textarea>

      {/* Run Button */}
      <button
        id="run-autonomy"
        style={{
          background: "#8a2be2",
          color: "white",
          padding: "15px",
          border: "none",
          borderRadius: "10px",
          fontSize: "18px",
          width: "100%",
          cursor: "pointer"
        }}
      >
        🚀 Run Cipher Autonomy
      </button>

      <h3>Run ID:</h3>
      <p id="run-id"></p>

      <h3>Version:</h3>
      <p id="version"></p>

      {/* Output */}
      <div
        id="autonomy-output"
        style={{
          background: "black",
          color: "#00ff66",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
          whiteSpace: "pre-wrap",
          minHeight: "200px"
        }}
      ></div>

      {/* Load Test Script */}
      <script src="/test.js"></script>
    </div>
  );
}
