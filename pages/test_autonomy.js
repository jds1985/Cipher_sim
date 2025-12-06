// pages/test_autonomy.js
import { useState } from "react";

export default function TestAutonomy() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState("—");
  const [version, setVersion] = useState("Cipher Autonomy v5");
  const [report, setReport] = useState("(No output yet)");

  const runAutonomy = async () => {
    setLoading(true);
    setReport("Running Cipher Autonomy v5...");
    setRunId("—");

    try {
      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      const data = await res.json();

      if (data.error) {
        setReport("Error: " + data.error);
        return;
      }

      setRunId(data.runId || "—");
      setVersion(data.version || "Cipher Autonomy v5");
      setReport(data.report || "(No output returned)");
    } catch (err) {
      setReport("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>🧪 Cipher Autonomy Test</h1>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Enter autonomy note..."
        style={{
          width: "100%",
          minHeight: "120px",
          padding: "12px",
          marginBottom: "16px",
        }}
      />

      <button
        onClick={runAutonomy}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          background: "#7b4dff",
          color: "#fff",
          borderRadius: "10px",
          fontSize: "18px",
          marginBottom: "20px",
        }}
      >
        {loading ? "Running..." : "🚀 Run Cipher Autonomy"}
      </button>

      <pre
        style={{
          background: "#000",
          color: "#00ff66",
          padding: "16px",
          borderRadius: "12px",
          whiteSpace: "pre-wrap",
        }}
      >
{`🔥 Autonomy Run ID: ${runId}
🧬 Version: ${version}

💭 Cipher Reflection:
${report}`}
      </pre>
    </div>
  );
}
