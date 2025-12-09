// components/chat/InputBar.jsx
import React from "react";

export default function InputBar({
  input,
  setInput,
  loading,
  onSend,
  onImageSelect,
  theme
}) {
  return (
    <div style={{ maxWidth: 700, margin: "16px auto 0 auto" }}>
      {/* Text input */}
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

      {/* Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        
        {/* SEND */}
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
          }}
        >
          Send
        </button>

        {/* IMAGE UPLOAD */}
        <button
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: theme.userBubble,
            color: "#fff",
            border: "none",
            fontSize: 24,
          }}
          onClick={() => document.getElementById("cipher-upload").click()}
        >
          🖼️
        </button>

        {/* Hidden File Input */}
        <input
          id="cipher-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onImageSelect(e.target.files[0]);
          }}
        />
      </div>
    </div>
  );
}
