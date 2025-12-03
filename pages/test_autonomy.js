// pages/test_autonomy.js
// Simple browser page to trigger Cipher's autonomy API

import { useState } from "react";

export default function TestAutonomy() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  async function runAutonomy() {
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/cipher_autonomy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dryRun: false }),
      });

      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🧪 Cipher Autonomy Test</h1>
      <p>Click the button below to trigger Cipher's autonomous cycle.</p>

      <button
        onClick={runAutonomy}
        style={{
          padding: "10px 20px",
          background: "#6C3DFF",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        {loading ? "Running..." : "Run Cipher Autonomy"}
      </button>

      <pre
        style={{
          marginTop: "20px",
          background: "#111",
          color: "#0f0",
          padding: "15px",
          borderRadius: "8px",
          whiteSpace: "pre-wrap",
          minHeight: "200px",
        }}
      >
        {output || "Output will appear here..."}
      </pre>
    </div>
  );
}
