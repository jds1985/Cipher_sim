import { useState } from "react";

export default function ImportHistoryPanel({ userId }) {
  const [status, setStatus] = useState("");
  const [counts, setCounts] = useState(null);

  const handleFile = async (file) => {
    setCounts(null);
    setStatus("Reading file…");

    const text = await file.text();

    setStatus("Uploading & importing…");

    const r = await fetch("/api/import-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        rawJson: text, // send as string, API parses
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      setStatus(`Import failed: ${data?.error || "unknown error"}`);
      return;
    }

    setCounts(data);
    setStatus("Import complete ✅");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Import History</h2>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Upload a JSON export. Cipher will convert it into memory nodes so it can reference your past conversations.
      </p>

      <input
        type="file"
        accept="application/json"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {status && <div style={{ marginTop: 12 }}>{status}</div>}

      {counts?.ok && (
        <div style={{ marginTop: 12, opacity: 0.9 }}>
          <div>Source: {counts.source}</div>
          <div>Threads imported: {counts.importedThreads}</div>
          <div>Memory nodes created: {counts.importedNodes}</div>
        </div>
      )}
    </div>
  );
}
