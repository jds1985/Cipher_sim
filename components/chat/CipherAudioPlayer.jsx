// components/chat/CipherAudioPlayer.jsx
import React from "react";

export default function CipherAudioPlayer({ audioBase64, theme }) {
  if (!audioBase64) return null;

  const play = () => {
    new Audio("data:audio/mp3;base64," + audioBase64)
      .play()
      .catch(() => {});
  };

  return (
    <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
      <button
        onClick={play}
        style={{
          background: theme.panelBg,
          color: theme.textColor,
          padding: "6px 12px",
          borderRadius: 999,
          border: `1px solid ${theme.inputBorder}`,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 0 12px rgba(148,163,184,0.3)",
          cursor: "pointer",
        }}
      >
        🔊 Play Voice
      </button>
    </div>
  );
}
