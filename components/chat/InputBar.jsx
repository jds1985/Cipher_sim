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

          // Resize: max width = 800
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            const scaleFactor = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = height * scaleFactor;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

          // 🚨 Strip header: we want ONLY raw base64
          const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

          resolve(base64);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const compressedBase64 = await compressImage(file);
    onImageSend(compressedBase64);
  }

  function handleSend() {
    if (!message.trim()) return;
    onSend(message.trim());
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

      <button className="send-btn" onClick={handleSend}>
        Send
      </button>
    </div>
  );
}
