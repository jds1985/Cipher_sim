// components/DevicePanel.js
import { useState, useEffect } from "react";

export default function DevicePanel({ theme, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/device_context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const data = await res.json();
      setSnapshot(data.context || {});
    } catch (err) {
      console.error("Device context error:", err);
      setSnapshot({ error: "Failed to load device context." });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  const saveToCipher = async () => {
    try {
      await fetch("/api/device_context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          snapshot
        })
      });
      alert("Saved to Cipher's memory.");
    } catch (err) {
      console.error(err);
      alert("Error saving snapshot.");
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: theme.background,
        color: theme.textColor,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif"
      }}
    >
      <button
        onClick={onClose}
        style={{
          padding: "8px 14px",
          background: theme.userBubble,
          borderRadius: 10,
          fontSize: 14,
          color: "white",
          marginBottom: 20,
          border: "none"
        }}
      >
        ← Back to Chat
      </button>

      <h1 style={{ marginBottom: 10 }}>Device Link</h1>
      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        Cipher reads your device conditions so he can act more like a real OS companion.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={loadSnapshot}
          style={{
            padding: "10px 16px",
            background: theme.buttonBg,
            border: "none",
            borderRadius: 10,
            color: "white"
          }}
        >
          Refresh Snapshot
        </button>

        <button
          onClick={saveToCipher}
          style={{
            padding: "10px 16px",
            background: theme.cipherBubble,
            border: "none",
            borderRadius: 10,
            color: "white"
          }}
        >
          Save Snapshot to Cipher
        </button>
      </div>

      <p style={{ marginBottom: 10 }}>
        Last updated: {loading ? "Loading..." : new Date().toLocaleTimeString()}
      </p>

      <pre
        style={{
          background: theme.panelBg,
          padding: 20,
          borderRadius: 12,
          overflowX: "auto"
        }}
      >
        {snapshot ? JSON.stringify(snapshot, null, 2) : "{}"}
      </pre>
    </div>
  );
}
