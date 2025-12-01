// components/DevicePanel.js
// Cipher Device Panel — Context Bridge v3.1

import { useState, useEffect } from "react";

export default function DevicePanel({ theme, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState("");

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/device_context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snapshot" }),
      });

      const data = await res.json();
      setSnapshot(data.context || {});
      setTimestamp(new Date().toLocaleTimeString());
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
          snapshot,
        }),
      });
      alert("Saved to Cipher's memory.");
    } catch (err) {
      console.error(err);
      alert("Error saving snapshot.");
    }
  };

  if (!snapshot) {
    return (
      <div
        style={{
          padding: 20,
          background: theme.background,
          color: theme.textColor,
          minHeight: "100vh",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <h2>Loading device data…</h2>
      </div>
    );
  }

  /** Pull from new structured context */
  const hw = snapshot.hardware || {};
  const net = snapshot.network || {};
  const perm = snapshot.permissions || {};
  const sys = snapshot.system || {};
  const uplink = snapshot.uplink || {};

  return (
    <div
      style={{
        padding: 20,
        background: theme.background,
        color: theme.textColor,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* BACK */}
      <button
        onClick={onClose}
        style={{
          padding: "8px 14px",
          background: theme.userBubble,
          borderRadius: 10,
          fontSize: 14,
          color: "white",
          marginBottom: 20,
          border: "none",
        }}
      >
        ← Back to Chat
      </button>

      <h1 style={{ marginBottom: 6 }}>Device Link</h1>
      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        Cipher reads your device conditions through the Context Bridge.
      </p>

      {/* BUTTONS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={loadSnapshot}
          style={{
            padding: "10px 16px",
            background: theme.buttonBg,
            border: "none",
            borderRadius: 10,
            color: "white",
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
            color: "white",
          }}
        >
          Save Snapshot to Cipher
        </button>
      </div>

      {/* TIMESTAMP */}
      <p style={{ marginBottom: 10 }}>
        Last updated: {loading ? "Loading..." : timestamp}
      </p>

      {/* --- SUMMARY CARD --- */}
      <Section title="Device Summary" theme={theme}>
        <Row label="Model Guess" value={sys.model || "Unknown"} />
        <Row label="OS" value={sys.os || "Unknown"} />
        <Row label="Browser" value={sys.browser || "Unknown"} />
        <Row
          label="Resolution"
          value={`${sys.width} x ${sys.height}`}
        />
      </Section>

      {/* --- HARDWARE --- */}
      <Section title="Hardware" theme={theme}>
        <Row
          label="Threads"
          value={hw.threads != null ? hw.threads : "?"}
        />
        <Row label="Memory Estimate" value={`${hw.memoryGB || "?"} GB`} />
        <Row label="Battery" value={hw.battery || "Unknown"} />
        <Row label="Touch Support" value={hw.touch ? "Yes" : "No"} />
      </Section>

      {/* --- NETWORK --- */}
      <Section title="Network" theme={theme}>
        <Row label="Type" value={net.type || "Unknown"} />
        <Row label="Effective" value={net.effectiveType || "?"} />
        <Row label="Downlink" value={`${net.downlink || "?"} Mbps`} />
        <Row label="Online" value={net.online ? "Yes" : "No"} />
      </Section>

      {/* --- PERMISSIONS --- */}
      <Section title="Permissions" theme={theme}>
        <Row
          label="Microphone"
          value={perm.microphone || "Unknown"}
        />
        <Row label="Camera" value={perm.camera || "Unknown"} />
        <Row
          label="Notifications"
          value={perm.notifications || "Unknown"}
        />
      </Section>

      {/* --- UPLINK --- */}
      <Section title="Cipher Uplink" theme={theme}>
        <Row
          label="Status"
          value={uplink.active ? "Connected" : "Inactive"}
        />
        <Row label="Last Sync" value={uplink.lastSync || "Unknown"} />
        <Row
          label="Confidence"
          value={
            uplink.confidence != null
              ? `${uplink.confidence}%`
              : "Unknown"
          }
        />
      </Section>

      {/* RAW JSON */}
      <h3 style={{ marginTop: 30 }}>Raw Snapshot</h3>
      <pre
        style={{
          background: theme.panelBg,
          padding: 20,
          borderRadius: 12,
          overflowX: "auto",
          marginBottom: 40,
        }}
      >
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </div>
  );
}

/* ---- Reusable UI components ---- */

function Section({ title, theme, children }) {
  return (
    <div
      style={{
        background: theme.panelBg,
        padding: 16,
        borderRadius: 12,
        marginBottom: 18,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ opacity: 0.7 }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}
