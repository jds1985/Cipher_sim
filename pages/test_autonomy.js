import { useState } from "react";

export default function TestAutonomy() {
  const [note, setNote] = useState("");
  const [runId, setRunId] = useState("");
  const [version, setVersion] = useState("");
  const [output, setOutput] = useState("");

  async function runAutonomy() {
    setOutput("Running...");

    try {
      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ note })
      });

      // If backend crashed, handle it cleanly
      if (!res.ok) {
        const errText = await res.text();
        setOutput("Server error: " + errText);
        return;
      }

      const data = await res.json();

      setRunId(data.autonomyRunId || "—");
      setVersion(data.version || "—");
      setOutput(data.reflection || "No output returned.");
    } catch (err) {
      setOutput("Request failed: " + err.message);
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🧪 Cipher Autonomy Test</h1>

      <textarea
        style={{
          width: "100%",
          height: "180px",
          fontSize: "16px",
          padding: "10px"
        }}
        placeholder="Enter autonomy note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button
        onClick={runAutonomy}
        style={{
          width: "100%",
          marginTop: "20px",
          padding: "15px",
          background: "#8b00ff",
          color: "white",
          fontSize: "20px",
          borderRadius: "10px"
        }}
      >
        🚀 Run Cipher Autonomy
      </button>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#000",
          color: "#0f0",
          borderRadius: "10px",
          fontSize: "16px",
          whiteSpace: "pre-wrap"
        }}
      >
        🔥 <b>Autonomy Run ID:</b> {runId}
        <br />
        🧬 <b>Version:</b> {version}
        <br />
        <br />
        📝 <b>Autonomy Output:</b>
        <br />
        {output}
      </div>
    </div>
  );
}
