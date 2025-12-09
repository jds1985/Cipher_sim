import React from "react";

export default function InputBar({
  input,
  setInput,
  loading,
  onSend,
  onImageUpload,
  theme,
}) {
  return (
    <div style={{ maxWidth: 700, margin: "16px auto 0 auto" }}>
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
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
        }}
      >
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
        <label
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: theme.userBubble,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          📎
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) onImageUpload(e.target.files[0]);
            }}
          />
        </label>
      </div>
    </div>
  );
}
