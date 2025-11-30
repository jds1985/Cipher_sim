// components/DevicePanel.js
// Cipher Device Intelligence Panel – Live Snapshot + Logging

import { useEffect, useState } from "react";

export default function DevicePanel({ theme, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logStatus, setLogStatus] = useState(null);

  // Build a fresh device snapshot using browser APIs
  const collectSnapshot = async () => {
    setLoading(true);
    setLogStatus(null);

    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      const scr = typeof screen !== "undefined" ? screen : null;
      const perf = typeof performance !== "undefined" ? performance : null;

      // ---- Battery (where supported) ----
      let batteryInfo = {
        supported: false,
        level: null,
        charging: null,
      };

      try {
        if (nav && nav.getBattery) {
          const battery = await nav.getBattery();
          batteryInfo = {
            supported: true,
            level: battery.level != null ? Math.round(battery.level * 100) : null,
            charging: battery.charging ?? null,
          };
        }
      } catch (err) {
        // Battery API not supported or blocked
      }

      // ---- Network info (where supported) ----
      let connectionInfo = {
        supported: false,
        type: null,
        effectiveType: null,
        downlink: null,
        rtt: null,
        saveData: null,
      };

      try {
        const connection =
          (nav && (nav.connection || nav.mozConnection || nav.webkitConnection)) ||
          null;
        if (connection) {
          connectionInfo = {
            supported: true,
            type: connection.type || null,
            effectiveType: connection.effectiveType || null,
            downlink: connection.downlink || null,
            rtt: connection.rtt || null,
            saveData: !!connection.saveData,
          };
        }
      } catch (err) {}

      // ---- Hardware & memory ----
      const hardwareInfo = {
        deviceMemory: nav && nav.deviceMemory ? nav.deviceMemory : null,
        logicalCores: nav && nav.hardwareConcurrency ? nav.hardwareConcurrency : null,
      };

      // ---- Screen & pixel density ----
      const screenInfo = {
        width: scr ? scr.width : null,
        height: scr ? scr.height : null,
        availWidth: scr ? scr.availWidth : null,
        availHeight: scr ? scr.availHeight : null,
        pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : null,
        orientation:
          typeof window !== "undefined" &&
          window.screen &&
          window.screen.orientation &&
          window.screen.orientation.type
            ? window.screen.orientation.type
            : null,
      };

      // ---- JS heap / performance (Chrome only) ----
      let performanceInfo = {
        supported: false,
        usedJSHeapSize: null,
        totalJSHeapSize: null,
        jsHeapSizeLimit: null,
      };

      try {
        if (perf && perf.memory) {
          performanceInfo = {
            supported: true,
            usedJSHeapSize: perf.memory.usedJSHeapSize || null,
            totalJSHeapSize: perf.memory.totalJSHeapSize || null,
            jsHeapSizeLimit: perf.memory.jsHeapSizeLimit || null,
          };
        }
      } catch (err) {}

      // ---- Uptime estimate (based on performance.timeOrigin) ----
      let uptimeMinutes = null;
      try {
        if (perf && perf.timeOrigin != null && perf.now) {
          const nowMs = perf.timeOrigin + perf.now();
          const diffMs = nowMs - perf.timeOrigin;
          uptimeMinutes = Math.round(diffMs / 1000 / 60);
        }
      } catch (err) {}

      // ---- Final snapshot object ----
      const snap = {
        timestamp: new Date().toISOString(),
        userAgent: nav ? nav.userAgent : null,
        language: nav ? nav.language : null,
        platform: nav ? nav.platform : null,
        battery: batteryInfo,
        connection: connectionInfo,
        hardware: hardwareInfo,
        screen: screenInfo,
        performance: performanceInfo,
        uptimeMinutes,
      };

      setSnapshot(snap);
    } finally {
      setLoading(false);
    }
  };

  // Collect on mount
  useEffect(() => {
    collectSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logToCipher = async () => {
    if (!snapshot) return;
    setLogStatus("Saving…");

    try {
      const res = await fetch("/api/device_log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot }),
      });

      const data = await res.json();
      if (data.ok) {
        setLogStatus("Saved to Cipher's device memory.");
      } else {
        setLogStatus("Save failed.");
      }
    } catch (err) {
      console.error("Device log error:", err);
      setLogStatus("Save failed.");
    }
  };

  const labelStyle = {
    fontSize: 12,
    opacity: 0.8,
  };

  const valueStyle = {
    fontSize: 14,
    fontWeight: 500,
    wordBreak: "break-word",
  };

  const cardStyle = {
    background: theme.panelBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    border: `1px solid ${theme.inputBorder || "rgba(148,163,184,0.4)"}`,
    boxShadow: "0 12px 30px rgba(15,23,42,0.35)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.textColor,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 16,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto 16px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Device Link</div>
          <h2 style={{ fontSize: 22, margin: 0 }}>Cipher × Your Phone</h2>
          <p style={{ fontSize: 12, margin: "4px 0 0 0", opacity: 0.8 }}>
            Cipher reads your device conditions to act more like a real OS companion.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "none",
            background: theme.userBubble,
            color: theme.textColor,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 0 18px rgba(148,163,184,0.5)",
          }}
        >
          ← Back to Chat
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={collectSnapshot}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              background: theme.buttonBg,
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 0 18px rgba(59,130,246,0.7)",
            }}
          >
            {loading ? "Refreshing…" : "Refresh Snapshot"}
          </button>

          <button
            onClick={logToCipher}
            disabled={!snapshot || loading}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              background: snapshot ? theme.cipherBubble : "#4b5563",
              color: "#fff",
              fontSize: 13,
              cursor: snapshot ? "pointer" : "default",
            }}
          >
            Save Snapshot to Cipher
          </button>

          {snapshot && (
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              Last updated: {new Date(snapshot.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        {logStatus && (
          <div
            style={{
              marginBottom: 10,
              fontSize: 12,
              opacity: 0.9,
            }}
          >
            {logStatus}
          </div>
        )}

        {/* Snapshot Cards */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
            Core Device Info
          </h3>
          {!snapshot ? (
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {loading ? "Collecting device snapshot…" : "No snapshot yet."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <div style={labelStyle}>Platform</div>
                <div style={valueStyle}>{snapshot.platform || "Unknown"}</div>
              </div>

              <div>
                <div style={labelStyle}>Language</div>
                <div style={valueStyle}>{snapshot.language || "Unknown"}</div>
              </div>

              <div style={{ gridColumn: "1 / 3" }}>
                <div style={labelStyle}>User Agent</div>
                <div style={valueStyle}>
                  {snapshot.userAgent || "Not available"}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Uptime (minutes)</div>
                <div style={valueStyle}>
                  {snapshot.uptimeMinutes != null
                    ? `${snapshot.uptimeMinutes} min`
                    : "Unknown"}
                </div>
              </div>
            </div>
          )}
        </div>

        {snapshot && (
          <>
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
                Battery & Power
              </h3>
              {!snapshot.battery.supported ? (
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Battery API not supported on this browser.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={labelStyle}>Battery Level</div>
                    <div style={valueStyle}>
                      {snapshot.battery.level != null
                        ? `${snapshot.battery.level}%`
                        : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Charging</div>
                    <div style={valueStyle}>
                      {snapshot.battery.charging == null
                        ? "Unknown"
                        : snapshot.battery.charging
                        ? "Yes"
                        : "No"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
                Network & Connection
              </h3>
              {!snapshot.connection.supported ? (
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Network Information API not supported.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={labelStyle}>Type</div>
                    <div style={valueStyle}>
                      {snapshot.connection.type || "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Effective Type</div>
                    <div style={valueStyle}>
                      {snapshot.connection.effectiveType || "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Downlink</div>
                    <div style={valueStyle}>
                      {snapshot.connection.downlink != null
                        ? `${snapshot.connection.downlink} Mbps`
                        : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Round Trip Time</div>
                    <div style={valueStyle}>
                      {snapshot.connection.rtt != null
                        ? `${snapshot.connection.rtt} ms`
                        : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Data Saver</div>
                    <div style={valueStyle}>
                      {snapshot.connection.saveData ? "Enabled" : "Off"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
                Screen & Hardware
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div>
                  <div style={labelStyle}>Resolution</div>
                  <div style={valueStyle}>
                    {snapshot.screen.width && snapshot.screen.height
                      ? `${snapshot.screen.width} × ${snapshot.screen.height}`
                      : "Unknown"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Available Area</div>
                  <div style={valueStyle}>
                    {snapshot.screen.availWidth && snapshot.screen.availHeight
                      ? `${snapshot.screen.availWidth} × ${snapshot.screen.availHeight}`
                      : "Unknown"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Pixel Ratio</div>
                  <div style={valueStyle}>
                    {snapshot.screen.pixelRatio != null
                      ? snapshot.screen.pixelRatio
                      : "Unknown"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Orientation</div>
                  <div style={valueStyle}>
                    {snapshot.screen.orientation || "Unknown"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Device Memory</div>
                  <div style={valueStyle}>
                    {snapshot.hardware.deviceMemory != null
                      ? `${snapshot.hardware.deviceMemory} GB (approx)`
                      : "Unknown"}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Logical Cores</div>
                  <div style={valueStyle}>
                    {snapshot.hardware.logicalCores != null
                      ? snapshot.hardware.logicalCores
                      : "Unknown"}
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
                JS Heap & Performance
              </h3>
              {!snapshot.performance.supported ? (
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Detailed heap metrics not available on this browser.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={labelStyle}>Used JS Heap</div>
                    <div style={valueStyle}>
                      {snapshot.performance.usedJSHeapSize != null
                        ? `${Math.round(
                            snapshot.performance.usedJSHeapSize / 1024 / 1024
                          )} MB`
                        : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Total JS Heap</div>
                    <div style={valueStyle}>
                      {snapshot.performance.totalJSHeapSize != null
                        ? `${Math.round(
                            snapshot.performance.totalJSHeapSize / 1024 / 1024
                          )} MB`
                        : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Heap Size Limit</div>
                    <div style={valueStyle}>
                      {snapshot.performance.jsHeapSizeLimit != null
                        ? `${Math.round(
                            snapshot.performance.jsHeapSizeLimit / 1024 / 1024
                          )} MB`
                        : "Unknown"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
