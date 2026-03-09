import { useState } from "react";

export default function ImportHistoryPanel({ userId }) {
  const [status, setStatus] = useState("");
  const [counts, setCounts] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file) => {
    setCounts(null);
    setStatus("Reading file…");
    setFileName(file.name);

    const text = await file.text();

    setStatus("Uploading & importing…");

    const r = await fetch("/api/import-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        rawJson: text,
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

      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        Upload a JSON export. Cipher will convert it into memory nodes so it can reference your past conversations.
      </p>

      {/* 🔊 Cipher Upload Button */}
      <label className="cipher-upload-btn">
        Choose JSON File
        <input
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {fileName && (
        <div className="cipher-upload-name">
          Selected: {fileName}
        </div>
      )}

      {status && (
        <div style={{ marginTop: 18, opacity: 0.85 }}>
          {status}
        </div>
      )}

      {counts?.ok && (
        <div style={{ marginTop: 18, opacity: 0.9 }}>
          <div>Source: {counts.source}</div>
          <div>Threads imported: {counts.importedThreads}</div>
          <div>Memory nodes created: {counts.importedNodes}</div>
        </div>
      )}
    </div>
  );
}
