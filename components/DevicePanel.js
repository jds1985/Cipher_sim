// components/DevicePanel.js
import { useEffect, useState } from "react";

export default function DevicePanel({
  theme,
  deviceContext,
  onSnapshot,
  onClose,
}) {
  const [snapshot, setSnapshot] = useState(deviceContext || null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [saving, setSaving] = useState(false);

  const t = theme || {
    background: "#020617",
    panelBg: "#020617",
    textColor: "#e5e7eb",
    buttonBg: "#1d4ed8",
    inputBorder: "#374151",
  };

  const makeSnapshot = async () => {
    const now = new Date();
    const base = {
      platform: navigator.platform || "unknown",
      language: navigator.language || "en-US",
      userAgent: navigator.userAgent || "",
      uptimeMinutes: Math.round(performance.now() / 60000),
      network: {},
      screen: {},
      jsHeap: {},
      battery: { level: null, charging: null },
      timestampIso: now.toISOString(),
    };

    // Network
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      base.network = {
        type: conn.type || "unknown",
        effectiveType: conn.effectiveType || "unknown",
        downlink: conn.downlink || null,
        rtt: conn.rtt || null,
        saveData: conn.saveData || false,
      };
    }

    // Screen
    base.screen = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      orientation:
        window.screen?.orientation?.type || window.orientation || "unknown",
    };

    // JS heap (if available)
    if (performance && performance.memory) {
      const mem = performance.memory;
      base.jsHeap = {
        usedMB: Math.round(mem.usedJSHeapSize / (1024 * 1024)),
        totalMB: Math.round(mem.totalJSHeapSize / (1024 * 1024)),
        limitMB: Math.round(mem.jsHeapSizeLimit / (1024 * 1024)),
      };
    }

    // Battery (if available)
    try {
      if (navigator.getBattery) {
        const batt = await navigator.getBattery();
        base.battery = {
          level: Math.round(batt.level * 100),
          charging: batt.charging,
        };
      }
    } catch {
      // ignore battery errors
    }

    setSnapshot(base);
    setLastUpdated(now.toLocaleTimeString());

    if (onSnapshot) onSnapshot(base);
  };

  useEffect(() => {
    if (!snapshot) {
      makeSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveToCipher = async () => {
    if (!snapshot) return;
    setSaving(true);
    try {
      // We already lifted the snapshot to index.js via onSnapshot,
      // so saving here is just user feedback.
      await new Promise((r) => setTimeout(r, 400));
      alert("Device snapshot linked to Cipher for future chats.");
    } finally {
      setSaving(false);
    }
  };

  const sectionStyle = {
    borderRadius: 16,
    padding: 16,
    background: "rgba(15,23,42,0.9)",
    border: `1px solid ${t.inputBorder}`,
    marginBottom: 14,
  };

  const labelStyle = {
    fontSize: 13,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.08,
    marginBottom: 4,
  };

  const valueStyle = {
    fontSize: 14,
    color: t.textColor,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.background,
        padding: 16,
        fontFamily: "Inter, sans-serif",
        color: t.textColor,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>Device Link</div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              Cipher × Your Phone
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              Cipher reads your device conditions to act more like a real OS
              companion.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "8px 14px",
              background: t.buttonBg,
              color: "#f9fafb",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            ← Back to Chat
          </button>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <button
            onClick={makeSnapshot}
            style={{
              flex: 0.7,
              borderRadius: 999,
              border: "none",
              padding: "10px 14px",
              background: t.buttonBg,
              color: "#f9fafb",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Refresh Snapshot
          </button>
          <button
            onClick={handleSaveToCipher}
            disabled={!snapshot || saving}
            style={{
              flex: 1,
              borderRadius: 999,
              border: "none",
              padding: "10px 14px",
              background: snapshot ? "#374151" : "#1f2937",
              color: "#e5e7eb",
              fontWeight: 500,
              fontSize: 14,
              opacity: snapshot ? 1 : 0.6,
            }}
          >
            {saving ? "Saving…" : "Save Snapshot to Cipher"}
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
          Last updated: {lastUpdated || "Not yet"}
        </div>

        {!snapshot ? (
          <p style={{ fontStyle: "italic" }}>Collecting device details…</p>
        ) : (
          <>
            {/* Core Info */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Core Device Info</div>
              <div style={valueStyle}>
                <strong>Platform</strong> {snapshot.platform}
                <br />
                <strong>Language</strong> {snapshot.language}
                <br />
                <strong>User Agent</strong> {snapshot.userAgent}
                <br />
                <strong>Uptime (minutes)</strong>{" "}
                {snapshot.uptimeMinutes ?? "n/a"}
              </div>
            </div>

            {/* Battery */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Battery &amp; Power</div>
              <div style={valueStyle}>
                <strong>Battery Level</strong>{" "}
                {snapshot.battery?.level != null
                  ? `${snapshot.battery.level}%`
                  : "Unknown"}
                <br />
                <strong>Charging</strong>{" "}
                {snapshot.battery?.charging == null
                  ? "Unknown"
                  : snapshot.battery.charging
                  ? "Yes"
                  : "No"}
              </div>
            </div>

            {/* Network */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Network &amp; Connection</div>
              <div style={valueStyle}>
                <strong>Type</strong> {snapshot.network?.type || "unknown"}
                <br />
                <strong>Effective Type</strong>{" "}
                {snapshot.network?.effectiveType || "unknown"}
                <br />
                <strong>Downlink</strong>{" "}
                {snapshot.network?.downlink != null
                  ? `${snapshot.network.downlink} Mbps`
                  : "n/a"}
                <br />
                <strong>Round Trip Time</strong>{" "}
                {snapshot.network?.rtt != null
                  ? `${snapshot.network.rtt} ms`
                  : "n/a"}
                <br />
                <strong>Data Saver</strong>{" "}
                {snapshot.network?.saveData ? "On" : "Off"}
              </div>
            </div>

            {/* Screen */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Screen &amp; Hardware</div>
              <div style={valueStyle}>
                <strong>Resolution</strong>{" "}
                {snapshot.screen?.width} × {snapshot.screen?.height}
                <br />
                <strong>Pixel Ratio</strong>{" "}
                {snapshot.screen?.pixelRatio ?? "n/a"}
                <br />
                <strong>Orientation</strong>{" "}
                {snapshot.screen?.orientation || "unknown"}
              </div>
            </div>

            {/* JS Heap */}
            {snapshot.jsHeap && Object.keys(snapshot.jsHeap).length > 0 && (
              <div style={sectionStyle}>
                <div style={labelStyle}>JS Heap &amp; Performance</div>
                <div style={valueStyle}>
                  <strong>Used JS Heap</strong>{" "}
                  {snapshot.jsHeap.usedMB != null
                    ? `${snapshot.jsHeap.usedMB} MB`
                    : "n/a"}
                  <br />
                  <strong>Total JS Heap</strong>{" "}
                  {snapshot.jsHeap.totalMB != null
                    ? `${snapshot.jsHeap.totalMB} MB`
                    : "n/a"}
                  <br />
                  <strong>Heap Size Limit</strong>{" "}
                  {snapshot.jsHeap.limitMB != null
                    ? `${snapshot.jsHeap.limitMB} MB`
                    : "n/a"}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
