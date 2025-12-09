// components/chat/InputBar.jsx
"use client";

export default function InputBar({
  input,
  setInput,
  loading,
  onSend,
  onToggleRecording,
  onToggleCameraMenu,
  isRecording,
  theme,
}) {
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "20px auto 0 auto",
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      {/* TEXT INPUT */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type to Cipher..."
        style={{
          flex: 1,
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${theme.inputBorder}`,
          background: theme.inputBg,
          color: theme.textColor,
        }}
      />

      {/* CAMERA BUTTON */}
      <button
        onClick={onToggleCameraMenu}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "none",
          background: theme.cameraBtn,
        }}
      >
        📷
      </button>

      {/* RECORDING BUTTON */}
      <button
        onClick={onToggleRecording}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "none",
          background: isRecording ? theme.recOn : theme.recOff,
        }}
      >
        🎤
      </button>

      {/* SEND BUTTON */}
      <button
        onClick={onSend}
        disabled={loading}
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          border: "none",
          background: theme.sendBtn,
          color: "#fff",
        }}
      >
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}
