"use client";
import { useState } from "react";

export default function ChatInput({ onSend, onImageSend }) {
  const [message, setMessage] = useState("");

  // ---------------------------
  // IMAGE COMPRESSION FUNCTION
  // ---------------------------
  async function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");

          // Resize logic: target width ~800px max
          const scaleFactor = 800 / img.width;
          canvas.width = 800;
          canvas.height = img.height * scaleFactor;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Compress: 0.75 is a sweet spot
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressedBase64);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await compressImage(file);
    onImageSend(compressed);
  }

  function handleSend() {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  }

  return (
    <div className="input-bar">
      <input
        className="chat-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type to Cipher..."
      />

      {/* Hidden file input */}
      <input
        id="vision-file-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      <button
        className="camera-btn"
        onClick={() => document.getElementById("vision-file-input").click()}
      >
        📷
      </button>

      <button className="send-btn" onClick={handleSend}>Send</button>
    </div>
  );
}
