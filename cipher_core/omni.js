// pages/omni.js
import { useState } from "react";

export default function OmniSearchTest() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/omni_search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "20px" }}>
        🔍 Omni Search — Test Console
      </h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask Cipher anything…"
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "18px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      />

      <button
        onClick={runSearch}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "18px",
          borderRadius: "8px",
          background: "#4b5dff",
          color: "white",
          border: "none",
          fontWeight: "600",
        }}
      >
        {loading ? "Thinking…" : "Run Search"}
      </button>

      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <pre
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#111",
            color: "#0f0",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}