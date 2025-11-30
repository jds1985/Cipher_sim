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
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        padding: 20,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          background: "#111827",
          color: "#fff",
          padding: 20,
          borderRadius: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2>📱 Cipher Device Bridge</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              fontSize: 20,
            }}
          >
            ✖
          </button>
        </div>

        {/* CALL */}
        <div style={{ marginBottom: 24 }}>
          <h3>📞 Quick Call</h3>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone number"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
          <button
            onClick={() => {
              if (phoneNumber) window.location.href = `tel:${phoneNumber}`;
            }}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              border: "none",
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
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
          <button
            onClick={() => {
              const encoded = encodeURIComponent(smsMessage);
              window.location.href = `sms:${phoneNumber}?body=${encoded}`;
            }}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              border: "none",
            }}
          >
            Open SMS app with this message
          </button>
        </div>

        {/* CLIPBOARD */}
        <div>
          <h3>📋 Clipboard</h3>
          <textarea
            value={clipboard}
            onChange={(e) => setClipboard(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
          <button
            onClick={() => navigator.clipboard.writeText(clipboard)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              border: "none",
            }}
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
