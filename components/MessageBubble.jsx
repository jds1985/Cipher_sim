import { useState } from "react";

export default function MessageBubble({ message }) {
  const isCipher = message.role === "assistant";
  const [isPlaying, setIsPlaying] = useState(false);

  async function playCipherAudio() {
    if (!message.text || !isCipher) return;

    try {
      setIsPlaying(true);

      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.text }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audio.play();

    } catch (err) {
      console.error("Audio playback error:", err);
      setIsPlaying(false);
    }
  }

  return (
    <div
      className={`message-bubble ${isCipher ? "cipher" : "user"}`}
      style={{
        display: "flex",
        justifyContent: isCipher ? "flex-start" : "flex-end",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "12px 16px",
          borderRadius: "12px",
          background: isCipher ? "#111" : "#4a1fff",
          color: "white",
          position: "relative",
        }}
      >
        {/* Message text */}
        <div>{message.text}</div>

        {/* 🔊 Voice icon (Cipher only) */}
        {isCipher && (
          <button
            onClick={playCipherAudio}
            style={{
              position: "absolute",
              right: "-36px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isPlaying ? "#0ff" : "#888",
              fontSize: "22px",
            }}
            title="Play Cipher Voice"
          >
            {isPlaying ? "🔵" : "🔊"}
          </button>
        )}
      </div>
    </div>
  );
}
