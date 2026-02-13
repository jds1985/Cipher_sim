// components/chat/CipherAudioPlayer.jsx
import React from "react";

export default function CipherAudioPlayer({ audioBase64 }) {
  if (!audioBase64) return null;

  const play = () => {
    new Audio("data:audio/mp3;base64," + audioBase64)
      .play()
      .catch(() => {});
  };

  return (
    <div className="cipher-audio-wrap">
      <button onClick={play} className="cipher-audio-btn">
        Play Voice
      </button>
    </div>
  );
}
