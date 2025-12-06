import { useState } from "react";

export default function TestAutonomy() {
  const [note, setNote] = useState("");
  const [output, setOutput] = useState("Waiting for a run...");
  const [loading, setLoading] = useState(false);

  const runAutonomy = async () => {
    setLoading(true);
    setOutput("Running Cipher Autonomy v5...");

    try {
      const res = await fetch("/api/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setOutput("❌ Error: " + (data.error || "Unknown error"));
        return;
      }

      // Format the output correctly
      setOutput(
        [
          `🔥 Run ID: ${data.runId}`,
          `🧬 Version: ${data.version}`,
          "",
          `💭 Cipher Reflection:\n${data.report}`,
        ].join("\n")
      );
    } catch (err) {
      setOutput("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
        🧪 Cipher Autonomy Test
      </h1>

      <p style={{ marginBottom: "16px", lineHeight: 1.5 }}>
        Type an optional note or context below, then click the button to run
        Cipher&apos;s Autonomy Engine v5. The output will appear below.
      </p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Example: Scan this week's work and identify the highest-leverage move."
        style={{
          width: "100%",
          minHeight: "120px",
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          fontSize: "15px",
          marginBottom: "16px",
        }}
      />

      <button
        onClick={runAutonomy}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          fontSize: "18px",
          fontWeight: 600,
          background: loading ? "#9c7dff" : "#7b4dff",
          color: "white",
          cursor: loading ? "default" : "pointer",
          boxShadow: "0 8px 18px rgba(123, 77, 255, 0.35)",
        }}
      >
        {loading ? "Running..." : "🚀 Run Cipher Autonomy"}
      </button>

      <pre
        style={{
          marginTop: "24px",
          padding: "16px",
          background: "#050505",
          color: "#00ff66",
          borderRadius: "10px",
          minHeight: "220px",
          whiteSpace: "pre-wrap",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        {output}
      </pre>
    </div>
  );
}
