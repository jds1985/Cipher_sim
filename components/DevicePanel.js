// components/DevicePanel.js
import { useState } from "react";

export default function DevicePanel({ onClose, prefillMessage = "" }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsMessage, setSmsMessage] = useState(prefillMessage);
  const [clipboard, setClipboard] = useState(prefillMessage || "");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        padding: "20px 0",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "92%",
          maxWidth: 480,
          background: "#111827",
          color: "#fff",
          padding: 20,
          borderRadius: 14,
          boxShadow: "0 0 25px rgba(0,0,0,0.4)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>📱 Cipher Device Bridge</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              fontSize: 26,
              padding: 4,
            }}
          >
            ✖
          </button>
        </div>

        {/* QUICK CALL */}
        <div style={{ marginBottom: 24 }}>
          <h3>📞 Quick Call</h3>

          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone number"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              border: "none",
            }}
          />

          <button
            onClick={() => {
              if (phoneNumber) window.location.href = `tel:${phoneNumber}`;
            }}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
          >
            Call this number
          </button>
        </div>

        {/* TEXT */}
        <div style={{ marginBottom: 24 }}>
          <h3>💬 Quick Text</h3>

          <textarea
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            placeholder="Your message..."
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              border: "none",
            }}
          />

          <button
            onClick={() => {
              const encoded = encodeURIComponent(smsMessage);
              window.location.href = `sms:${phoneNumber}?body=${encoded}`;
            }}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
          >
            Open SMS app with this message
          </button>
        </div>

        {/* CLIPBOARD */}
        <div style={{ marginBottom: 12 }}>
          <h3>📋 Clipboard</h3>

          <textarea
            value={clipboard}
            onChange={(e) => setClipboard(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              border: "none",
            }}
          />

          <button
            onClick={() => navigator.clipboard.writeText(clipboard)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
