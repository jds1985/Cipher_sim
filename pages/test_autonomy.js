// pages/test.js
import { useState } from "react";

export default function CipherAutonomyTest() {
  const [note, setNote] = useState("");
  const [runId, setRunId] = useState(null);
  const [version, setVersion] = useState(null);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAutonomy() {
    setLoading(true);
    setReflection("");
    setRunId(null);
    setVersion(null);

    try {
      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      const data = await res.json();

      // If backend error
      if (!res.ok) {
        setReflection("❌ API Error: " + (data.error || "Unknown issue"));
        setLoading(false);
        return;
      }

      // UI fix — these must match API keys
      setRunId(data.autonomyRunId || "—");
      setVersion(data.version || "—");
      setReflection(data.reflection || data.output || "(No output returned)");
    } catch (err) {
      console.error(err);
      setReflection("❌ Network or server error.");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: "32px" }}>🧪 Cipher Autonomy Test</h1>

      <textarea
        placeholder="Type your autonomy instruction here…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{
          width: "100%",
          height: "150px",
          padding: "12px",
          fontSize: "16px",
          marginTop: "15px",
        }}
      />

      <button
        onClick={runAutonomy}
        disabled={loading}
        style={{
          width: "100%",
          padding: "18px",
          marginTop: "20px",
          background: "#7c3aed",
          color: "white",
          borderRadius: "10px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        {loading ? "Running…" : "🚀 Run Cipher Autonomy"}
      </button>

      {/* RESULTS SECTION */}
      {runId && (
        <div
          style={{
            background: "black",
            color: "#00ff88",
            padding: "20px",
            marginTop: "25px",
            borderRadius: "12px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <div>🔥 <b>Autonomy Run ID:</b> {runId}</div>
          <div>🧬 <b>Version:</b> {version}</div>
          <br />
          <div>💭 <b>Cipher Reflection:</b></div>
          <div>{reflection}</div>
        </div>
      )}
    </div>
  );
}
