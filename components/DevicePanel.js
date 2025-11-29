// components/DevicePanel.js
// Cipher Device Bridge v1 — Call / Text / Copy

import { useState } from "react";

export default function DevicePanel({ onClose, theme }) {
  const [callNumber, setCallNumber] = useState("");
  const [smsNumber, setSmsNumber] = useState("");
  const [smsBody, setSmsBody] = useState(
    "Hey, this is a message drafted with Cipher. 😊"
  );

  const [clipboardText, setClipboardText] = useState(
    "This is a sample message from Cipher that you can paste anywhere."
  );

  const doCall = () => {
    if (!callNumber.trim()) {
      alert("Add a phone number first.");
      return;
    }
    window.location.href = `tel:${callNumber.trim()}`;
  };

  const doSms = () => {
    if (!smsNumber.trim()) {
      alert("Add a phone number first.");
      return;
    }
    const url = `sms:${smsNumber.trim()}?body=${encodeURIComponent(smsBody)}`;
    window.location.href = url;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(clipboardText);
      alert("Copied to clipboard.");
    } catch (err) {
      console.error("Clipboard error:", err);
      alert("Could not copy text.");
    }
  };

  const panelBg = theme?.panelBg || "rgba(15,23,42,0.95)";
  const borderColor = theme?.inputBorder || "#4b5563";
  const textColor = theme?.textColor || "#e5e7eb";
  const buttonBg = theme?.buttonBg || "#1d4ed8";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          background: panelBg,
          borderRadius: 16,
          padding: 18,
          border: `1px solid ${borderColor}`,
          boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
          color: textColor,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              📱 Cipher Device Bridge
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, opacity: 0.8 }}>
              Use Cipher to help you call, text, and copy messages.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "4px 10px",
              background: "rgba(15,23,42,0.85)",
              color: textColor,
              fontSize: 13,
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* CALL SECTION */}
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, marginBottom: 6 }}>📞 Quick Call</h3>
          <p style={{ margin: "0 0 8px 0", fontSize: 12, opacity: 0.8 }}>
            Type a number and let Cipher launch your dialer.
          </p>
          <input
            value={callNumber}
            onChange={(e) => setCallNumber(e.target.value)}
            placeholder="Phone number (eg. 602-555-1234)"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
              background: "rgba(15,23,42,0.9)",
              color: textColor,
              fontSize: 13,
              marginBottom: 8,
            }}
          />
          <button
            onClick={doCall}
            style={{
              width: "100%",
              padding: "8px 0",
              borderRadius: 999,
              border: "none",
              background: buttonBg,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Call this number
          </button>
        </div>

        {/* SMS SECTION */}
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, marginBottom: 6 }}>💬 Quick Text</h3>
          <p style={{ margin: "0 0 8px 0", fontSize: 12, opacity: 0.8 }}>
            Draft a text with Cipher and send it from your SMS app.
          </p>
          <input
            value={smsNumber}
            onChange={(e) => setSmsNumber(e.target.value)}
            placeholder="Phone number"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
              background: "rgba(15,23,42,0.9)",
              color: textColor,
              fontSize: 13,
              marginBottom: 6,
            }}
          />
          <textarea
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
              background: "rgba(15,23,42,0.9)",
              color: textColor,
              fontSize: 13,
              marginBottom: 8,
              resize: "vertical",
            }}
          />
          <button
            onClick={doSms}
            style={{
              width: "100%",
              padding: "8px 0",
              borderRadius: 999,
              border: "none",
              background: buttonBg,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Open SMS app with this message
          </button>
        </div>

        {/* CLIPBOARD SECTION */}
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, marginBottom: 6 }}>📋 Clipboard</h3>
          <p style={{ margin: "0 0 8px 0", fontSize: 12, opacity: 0.8 }}>
            Copy any Cipher-generated text and paste it into apps, DMs, or posts.
          </p>
          <textarea
            value={clipboardText}
            onChange={(e) => setClipboardText(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
              background: "rgba(15,23,42,0.9)",
              color: textColor,
              fontSize: 13,
              marginBottom: 8,
              resize: "vertical",
            }}
          />
          <button
            onClick={copyToClipboard}
            style={{
              width: "100%",
              padding: "8px 0",
              borderRadius: 999,
              border: "none",
              background: buttonBg,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
