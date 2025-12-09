// components/chat/InputBar.jsx
"use client";
import React from "react";

export default function InputBar({
  input,
  setInput,
  loading,
  onSend,
  onImageSelect,
  onToggleRecording,
  isRecording,
  onToggleCameraMenu,
  theme,
}) {
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
      {/* TEXT AREA */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type to Cipher..."
        rows={2}
        disabled={loading}
        style={{
          width: "100%",
          borderRadius: 10,
          padding: "10px 14px",
          border: `1px solid ${theme.inputBorder}`,
          background: theme.inputBg,
          color: theme.textColor,
          boxShadow: "0 0 16px rgba(15,23,42,0.8)",
          resize: "none",
        }}
      />

      {/* BUTTON ROW */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* SEND BUTTON */}
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
            fontSize: 16,
            boxShadow: "0 0 20px rgba(59,130,246,0.6)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Send
        </button>

        {/* MIC BUTTON */}
        <button
          onClick={onToggleRecording}
          disabled={loading}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "none",
            background: isRecording ? "#dc2626" : theme.cipherBubble,
            color: "#fff",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isRecording
              ? "0 0 16px rgba(248,113,113,0.9)"
              : "0 0 10px rgba(148,163,184,0.5)",
          }}
        >
          {isRecording ? "■" : "🎤"}
        </button>

        {/* CAMERA MENU TOGGLE */}
        <button
          onClick={onToggleCameraMenu}
          disabled={loading}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "none",
            background: theme.userBubble,
            color: "#fff",
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 14px rgba(96,165,250,0.8)",
          }}
        >
          📷
        </button>
      </div>

      {/* HIDDEN FILE INPUT FOR VISION */}
      <input
        id="cipher-image-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onImageSelect(e.target.files[0]);
        }}
      />
    </div>
  );
}
