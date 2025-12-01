// components/DevicePanel.js
// Cipher Device Panel — Context Bridge v4.0 (Live Uplink Monitor)

import { useState, useEffect } from "react";

export default function DevicePanel({ theme, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState("");

  /* ---------------------------------------------------------
     LOAD SNAPSHOT (Client-Side Collector v3)
  --------------------------------------------------------- */
  const loadSnapshot = async () => {
    setLoading(true);

    try {
      // --- System Info ---
      const ua = navigator.userAgent || "";
      let os = "Unknown";
      if (/Android/i.test(ua)) os = "Android";
      else if (/iPhone|iPad/i.test(ua)) os = "iOS";
      else if (/Windows/i.test(ua)) os = "Windows";
      else if (/Mac/i.test(ua)) os = "macOS";

      const browser = (() => {
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari")) return "Safari";
        return "Unknown";
      })();

      const system = {
        model: "Unknown",
        os,
        browser,
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // --- Hardware ---
      const hardware = {
        threads: navigator.hardwareConcurrency || null,
        memoryGB: navigator.deviceMemory || null,
        battery: "Unknown",
        touch: "ontouchstart" in window ? true : false,
      };

      try {
        const battery = await navigator.getBattery();
        hardware.battery = `${Math.round(battery.level * 100)}%`;
      } catch {
        hardware.battery = "Unknown";
      }

      // --- Network ---
      const conn = navigator.connection || {};
      const network = {
        type: conn.type || "Unknown",
        effectiveType: conn.effectiveType || "Unknown",
        downlink: conn.downlink || null,
        online: navigator.onLine,
      };

      // --- Permissions ---
      const permissions = {
        microphone: "Unknown",
        camera: "Unknown",
        notifications: Notification.permission || "Unknown",
      };

      try {
        const mic = await navigator.permissions.query({ name: "microphone" });
        permissions.microphone = mic.state;
      } catch {}

      try {
        const cam = await navigator.permissions.query({ name: "camera" });
        permissions.camera = cam.state;
      } catch {}

      // --- UPLINK (initial) ---
      const uplink = {
        active: true,
        lastSync: new Date().toLocaleTimeString(),
        confidence: 100,
      };

      const fullSnapshot = {
        system,
        hardware,
        network,
        permissions,
        uplink,
      };

      setSnapshot(fullSnapshot);
      setTimestamp(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Snapshot error:", err);
      setSnapshot({ error: "Failed to read device info." });
    }

    setLoading(false);
  };

  /* ---------------------------------------------------------
     REAL-TIME UPLINK MONITOR (Every 5 Seconds)
     Simulates Cipher's OS-level link + health scoring
  --------------------------------------------------------- */
  useEffect(() => {
    if (!snapshot) return;

    const interval = setInterval(() => {
      setSnapshot((prev) => {
        if (!prev) return prev;

        // Confidence drops if offline
        let confidence = prev.network.online ? prev.uplink.confidence : 10;

        // Simulate small natural drift
        confidence = Math.max(
          5,
          Math.min(100, confidence + (Math.random() * 6 - 3))
        );

        return {
          ...prev,
          uplink: {
            active: true,
            lastSync: new Date().toLocaleTimeString(),
            confidence: Math.round(confidence),
          },
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [snapshot]);

  /* ---------------------------------------------------------
     INITIAL LOAD
  --------------------------------------------------------- */
  useEffect(() => {
    loadSnapshot();
  }, []);

  /* ---------------------------------------------------------
     SAVE SNAPSHOT TO CIPHER (Optional)
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     LOADING VIEW
  --------------------------------------------------------- */
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

  const { system, hardware, network, permissions, uplink } = snapshot;

  /* ---------------------------------------------------------
     MAIN UI
  --------------------------------------------------------- */
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

      <p style={{ marginBottom: 10 }}>
        Last updated: {loading ? "Loading..." : timestamp}
      </p>

      {/* SUMMARY */}
      <Section title="Device Summary" theme={theme}>
        <Row label="Model Guess" value={system.model} />
        <Row label="OS" value={system.os} />
        <Row label="Browser" value={system.browser} />
        <Row label="Resolution" value={`${system.width} x ${system.height}`} />
      </Section>

      {/* HARDWARE */}
      <Section title="Hardware" theme={theme}>
        <Row label="Threads" value={hardware.threads || "?"} />
        <Row label="Memory Estimate" value={`${hardware.memoryGB || "?"} GB`} />
        <Row label="Battery" value={hardware.battery} />
        <Row label="Touch Support" value={hardware.touch ? "Yes" : "No"} />
      </Section>

      {/* NETWORK */}
      <Section title="Network" theme={theme}>
        <Row label="Type" value={network.type} />
        <Row label="Effective" value={network.effectiveType} />
        <Row label="Downlink" value={`${network.downlink || "?"} Mbps`} />
        <Row label="Online" value={network.online ? "Yes" : "No"} />
      </Section>

      {/* PERMISSIONS */}
      <Section title="Permissions" theme={theme}>
        <Row label="Microphone" value={permissions.microphone} />
        <Row label="Camera" value={permissions.camera} />
        <Row label="Notifications" value={permissions.notifications} />
      </Section>

      {/* LIVE UPLINK */}
      <Section title="Cipher Uplink" theme={theme}>
        <Row label="Status" value={uplink.active ? "Connected" : "Inactive"} />
        <Row label="Last Sync" value={uplink.lastSync} />
        <Row label="Confidence" value={`${uplink.confidence}%`} />
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

/* COMPONENTS */
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
