// components/chat/InputBar.jsx
import React from "react";
import { sendVisionToCipher } from "../../utils/sendVision";

export default function InputBar({
  input,
  setInput,
  loading,
  onSend,
  onToggleRecording,
  isRecording,
  theme,
  addMessage, // <-- REQUIRED FOR VISION
}) {
  // Vision Handler
  async function handleVisionCapture() {
    return new Promise((resolve) => {
      const inputEl = document.createElement("input");
      inputEl.type = "file";
      inputEl.accept = "image/*";
      inputEl.capture = "environment";

      inputEl.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return resolve();

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result;

          // Add placeholder message
          addMessage("user", "[Photo Sent]");

          // Send to Cipher Vision API
          const reply = await sendVisionToCipher(base64);

          // Display Cipher’s response
          addMessage("cipher", reply);

          resolve();
        };

        reader.readAsDataURL(file);
      };

      inputEl.click();
    });
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "16px auto 0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type to Cipher..."
        rows={2}
        style={{
          width: "100%",
          borderRadius: 10,
          padding: "10px 14px",
          border: `1px solid ${theme.inputBorder}`,
          background: theme.inputBg,
          color: theme.textColor,
          boxShadow: "0 0 16px rgba(15,23,42,0.8)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Send */}
        <button
          onClick={onSend}
          disabled={loading}
          style={{
            flex: 1,
            background: theme.buttonBg,
            color: "white",
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            fontWeight: 600,
            boxShadow: "0 0 20px rgba(59,130,246,0.6)",
          }}
        >
          Send
        </button>

        {/* MIC */}
        <button
          onClick={onToggleRecording}
          disabled={loading}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "none",
            background: isRecording ? "#b91c1c" : theme.cipherBubble,
            color: "#fff",
            fontSize: 20,
            boxShadow: isRecording
              ? "0 0 16px rgba(248,113,113,0.9)"
              : "0 0 10px rgba(148,163,184,0.5)",
          }}
        >
          {isRecording ? "■" : "🎤"}
        </button>

        {/* CAMERA */}
        <button
          onClick={handleVisionCapture}
          disabled={loading}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "none",
            background: theme.userBubble,
            color: "#fff",
            fontSize: 22,
            boxShadow: "0 0 14px rgba(96,165,250,0.8)",
          }}
        >
          📷
        </button>
      </div>
    </div>
  );
}
