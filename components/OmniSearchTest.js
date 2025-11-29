// components/OmniSearchTest.js
import { useState } from "react";

export default function OmniSearchTest() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/omni_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Search failed or server error." });
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>
        🔍 OmniSearch Test
      </h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a search query..."
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #666",
          marginBottom: 10,
          fontSize: 16,
        }}
      />

      <button
        onClick={runSearch}
        style={{
          padding: "12px 20px",
          width: "100%",
          background: "#7c3aed",
          border: "none",
          borderRadius: 10,
          color: "white",
          fontWeight: 600,
          marginBottom: 20,
          fontSize: 16,
        }}
      >
        {loading ? "Searching..." : "Run OmniSearch"}
      </button>

      {result && (
        <div
          style={{
            padding: 20,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <strong>Result:</strong>
          <br />
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}
