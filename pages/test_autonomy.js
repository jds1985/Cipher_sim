// pages/test_autonomy.js
import { useEffect } from "react";

export default function TestAutonomy() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🧪 Cipher Autonomy Test</h1>
      <p>Run the v8 autonomy engine below.</p>

      {/* Input box */}
      <textarea
        id="autonomy-input"
        style={{
          width: "100%",
          height: "220px",
          fontSize: "14px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "20px"
        }}
        placeholder="Paste your test prompt here..."
      ></textarea>

      {/* Run Button */}
      <button
        id="run-autonomy"
        style={{
          background: "#8b2cff",
          color: "white",
          padding: "14px 22px",
          borderRadius: "10px",
          fontSize: "18px",
          border: "none",
          marginBottom: "20px"
        }}
      >
        🚀 Run Cipher Autonomy
      </button>

      <div><strong>Run ID:</strong> <span id="run-id"></span></div>
      <div><strong>Version:</strong> <span id="version"></span></div>

      <div
        id="autonomy-output"
        style={{
          marginTop: "20px",
          padding: "20px",
          background: "#000",
          color: "#0f0",
          minHeight: "300px",
          borderRadius: "12px"
        }}
      ></div>

      {/* LOAD THE CLIENT-SIDE SCRIPT SAFELY */}
      <script src="/test.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    </div>
  );
}
