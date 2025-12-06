// pages/test_autonomy.js

import { useState } from "react";

export default function TestAutonomy() {
  const [note, setNote] = useState("");
  const [output, setOutput] = useState("");
  const [runId, setRunId] = useState("");
  const [version, setVersion] = useState("");

  async function runAutonomy() {
    setOutput("Running...");
    setRunId("");
    setVersion("");

    try {
      const res = await fetch("/api/autonomy_v7", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      const data = await res.json();

      if (data.error) {
        setOutput("Error: " + data.error);
        return;
      }

      setRunId(data.autonomyRunId || "—");
      setVersion(data.version || "Cipher Autonomy v7");
      setOutput(data.output || "(No output returned)");
    } catch (err) {
      setOutput("Request failed: " + err.message);
    }
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>
        🧪 Cipher Autonomy Test
      </h1>

      <textarea
        placeholder="Enter autonomy note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{
          width: "100%",
          height: "160px",
          padding: "12px",
          fontSize: "1rem",
          borderRadius: "10px",
          border: "2px solid #ccc",
          marginBottom: "20px",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
        }}
      />

      <button
        onClick={runAutonomy}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "1.3rem",
          background: "#8b4dff",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "600",
          marginBottom: "30px",
        }}
      >
        🚀 Run Cipher Autonomy
      </button>

      {output ? (
        <div
          style={{
            background: "black",
            color: "#00ff88",
            padding: "20px",
            borderRadius: "12px",
            fontFamily: "monospace",
            fontSize: "0.95rem",
            whiteSpace: "pre-wrap",
          }}
        >
          <div>
            🔥 <b>Autonomy Run ID:</b> {runId}
          </div>
          <div>
            🧬 <b>Version:</b> {version}
          </div>

          <br />

          <div>
            📄 <b>Autonomy Output:</b>
          </div>

          <div style={{ marginTop: "10px" }}>{output}</div>
        </div>
      ) : null}
    </div>
  );
}
