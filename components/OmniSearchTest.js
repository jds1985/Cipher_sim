import React, { useState } from "react";

export default function OmniSearchTest() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function runSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch("/api/omni_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userId: "jim",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Unknown error");
      }

      const data = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔍 OmniSearch Test</h2>

      <input
        style={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a search query..."
      />

      <button style={styles.button} onClick={runSearch} disabled={loading}>
        {loading ? "Searching..." : "Run OmniSearch"}
      </button>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {result && (
        <div style={styles.resultBox}>
          <h3 style={styles.section}>💬 Final Answer</h3>
          <p style={styles.answer}>{result.answer}</p>

          <h3 style={styles.section}>
            🌱 Memory Hits ({result.memoryHits.length})
          </h3>
          {result.memoryHits.map((hit, idx) => (
            <div key={idx} style={styles.card}>
              <strong>Score:</strong> {hit.score.toFixed(3)} <br />
              <strong>User:</strong> {hit.userMessage} <br />
              <strong>Cipher:</strong> {hit.cipherReply} <br />
              <strong>Time:</strong>{" "}
              {hit.timestamp
                ? new Date(hit.timestamp).toLocaleString()
                : "Unknown"}
            </div>
          ))}

          <h3 style={styles.section}>🌐 Web Results ({result.webHits.length})</h3>
          {result.webHits.map((hit, idx) => (
            <div key={idx} style={styles.card}>
              <strong>{hit.title}</strong>
              <p>{hit.snippet}</p>
              <a href={hit.url} style={styles.link}>
                {hit.url}
              </a>
            </div>
          ))}

          <h3 style={styles.section}>⚙️ Metadata</h3>
          <pre style={styles.meta}>{JSON.stringify(result.meta, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Inter, sans-serif",
    color: "#fff",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    marginBottom: "10px",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    background: "#6a4dfc",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    border: "none",
    marginBottom: "20px",
  },
  error: {
    padding: "10px",
    background: "#ff6666",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  resultBox: {
    marginTop: "20px",
  },
  section: {
    fontSize: "20px",
    fontWeight: "600",
    marginTop: "20px",
  },
  card: {
    padding: "12px",
    background: "#1e1e1e",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  answer: {
    padding: "12px",
    background: "#252525",
    borderRadius: "8px",
  },
  link: {
    color: "#8ab4ff",
    fontSize: "14px",
  },
  meta: {
    background: "#111",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "12px",
    overflowX: "scroll",
  },
};
