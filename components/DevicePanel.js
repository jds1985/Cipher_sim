import { useEffect, useState } from "react";

export default function DevicePanel({ theme, onClose }) {
  const [info, setInfo] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // -----------------------------
  // GET FULL SNAPSHOT
  // -----------------------------
  const getSnapshot = async () => {
    try {
      const res = await fetch("/api/device_snapshot", {
        method: "POST",
      });
      const data = await res.json();
      setInfo(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Snapshot error:", err);
    }
  };

  useEffect(() => {
    getSnapshot();
  }, []);

  // -----------------------------
  // CONTEXT BRIDGE — LIVE DEVICE LISTENERS
  // -----------------------------
  useEffect(() => {
    const sendDelta = (delta) => {
      fetch("/api/context_delta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    };

    // BATTERY LISTENER
    navigator.getBattery?.().then((battery) => {
      const batteryHandler = () => {
        sendDelta({
          type: "battery",
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        });
      };

      battery.addEventListener("levelchange", batteryHandler);
      battery.addEventListener("chargingchange", batteryHandler);
      batteryHandler();
    });

    // NETWORK LISTENER
    const net =
      navigator.connection ||
      navigator.webkitConnection ||
      navigator.mozConnection;

    if (net) {
      const netHandler = () => {
        sendDelta({
          type: "network",
          effectiveType: net.effectiveType,
          downlink: net.downlink,
          rtt: net.rtt,
          online: navigator.onLine,
        });
      };
      net.addEventListener("change", netHandler);
      netHandler();
    }

    // ONLINE / OFFLINE LISTENER
    const onlineHandler = () =>
      sendDelta({ type: "online", online: navigator.onLine });

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", onlineHandler);

    // ORIENTATION LISTENER
    const orientHandler = () =>
      sendDelta({
        type: "orientation",
        orientation: screen.orientation?.type || "unknown",
      });

    screen.orientation?.addEventListener("change", orientHandler);
    orientHandler();

    // VISIBILITY LISTENER
    const visHandler = () =>
      sendDelta({
        type: "visibility",
        state: document.visibilityState,
      });

    document.addEventListener("visibilitychange", visHandler);

    // CLEANUP
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", onlineHandler);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, []);

  return (
    <div
      style={{
        background: theme.background,
        minHeight: "100vh",
        padding: 20,
        color: theme.textColor,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <button
        onClick={onClose}
        style={{
          padding: "8px 14px",
          borderRadius: 12,
          background: theme.userBubble,
          border: "none",
          marginBottom: 20,
          color: theme.textColor,
        }}
      >
        ← Back to Chat
      </button>

      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Device Link</h1>
      <p style={{ opacity: 0.8, marginBottom: 20 }}>
        Cipher reads your device conditions so he can act more like a real OS
        companion.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={getSnapshot}
          style={{
            padding: "10px 16px",
            background: theme.buttonBg,
            color: "white",
            borderRadius: 10,
            border: "none",
          }}
        >
          Refresh Snapshot
        </button>

        <button
          onClick={() => {
            fetch("/api/save_snapshot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ snapshot: info }),
            });
          }}
          style={{
            padding: "10px 16px",
            background: theme.cipherBubble,
            color: "white",
            borderRadius: 10,
            border: "none",
          }}
        >
          Save Snapshot to Cipher
        </button>
      </div>

      <p style={{ opacity: 0.6, marginBottom: 20 }}>
        Last updated: {lastUpdated || "Loading..."}
      </p>

      <pre
        style={{
          background: theme.panelBg,
          padding: 20,
          borderRadius: 12,
          whiteSpace: "pre-wrap",
          lineHeight: "1.4em",
        }}
      >
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  );
}
