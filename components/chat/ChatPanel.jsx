// components/chat/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import {
  createBaseMemory,
  extractFactsIntoMemory,
} from "../../logic/memoryCore";

/* ---------------------------------------------
   SEND TEXT → /api/chat
--------------------------------------------- */
const sendTextToCipher = async ({ text, memory, voiceEnabled }) => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        userId: "jim", // you can change this later if needed
        memory,
        voiceEnabled,
      }),
    });

    const data = await res.json();
    return { reply: data.reply || "No response.", voice: data.voice || null };
  } catch (err) {
    console.error("API Chat Error:", err);
    return { reply: "API error.", voice: null };
  }
};

/* ---------------------------------------------
   SEND IMAGE → /api/vision_chat
   (expects { image: <data-url> })
--------------------------------------------- */
const sendImageToCipher = async ({ image }) => {
  try {
    const res = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,       // full data URL: "data:image/jpeg;base64,...."
        userId: "jim",
      }),
    });

    const data = await res.json();
    return { reply: data.reply || "Vision error.", voice: data.voice || null };
  } catch (err) {
    console.error("Vision error:", err);
    return { reply: "Vision error.", voice: null };
  }
};

export default function ChatPanel({ theme }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const chatEndRef = useRef(null);
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  /* LOAD SAVED CHAT + MEMORY */
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v3");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v3");
      if (storedMemory) setCipherMemory(JSON.parse(storedMemory));

      const storedVoice = localStorage.getItem("cipher_voice_enabled_v2");
      if (storedVoice === "false") setVoiceEnabled(false);
    } catch {}
  }, []);

  /* SAVE CHAT */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [messages]);

  /* SAVE MEMORY */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v3", JSON.stringify(cipherMemory));
    } catch {}
  }, [cipherMemory]);

  /* SAVE VOICE STATE */
  useEffect(() => {
    try {
      localStorage.setItem(
        "cipher_voice_enabled_v2",
        voiceEnabled ? "true" : "false"
      );
    } catch {}
  }, [voiceEnabled]);

  /* ---------------------------------------------------------
     SEND TEXT MESSAGE
  --------------------------------------------------------- */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const text = input.trim();

    // Memory extraction
    const updatedMem = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(updatedMem);

    // Push user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const { reply, voice } = await sendTextToCipher({
        text,
        memory: updatedMem,
        voiceEnabled,
      });

      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: reply, voice: voice || null },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Server error." },
      ]);
    }

    setLoading(false);
  };

  /* ---------------------------------------------------------
     COMPRESS + SEND IMAGE
  --------------------------------------------------------- */
  const handleImageUpload = async (file) => {
    if (!file) return;
    setLoading(true);

    try {
      // 1) Read file as data URL
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2) Compress via canvas (keep EXIF irrelevant, we just care about pixels)
      const compressedDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 800;
          const scale = Math.min(1, MAX_WIDTH / img.width);

          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // quality 0.7 → good balance
          const out = canvas.toDataURL("image/jpeg", 0.7);
          resolve(out);
        };
        img.onerror = reject;
        img.src = dataUrl;
      });

      // 3) Optional: show that an image was sent
      setMessages((prev) => [
        ...prev,
        { role: "user", text: "[Image sent to Cipher Vision]" },
      ]);

      // 4) Send to API
      const { reply, voice } = await sendImageToCipher({
        image: compressedDataUrl,
      });

      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: reply, voice: voice || null },
      ]);
    } catch (err) {
      console.error("Vision pipeline error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Vision error." },
      ]);
    }

    setLoading(false);
  };

  /* CAMERA MENU HANDLING */
  const handleCamera = (mode) => {
    setCameraMenuOpen(false);

    const el = document.createElement("input");
    el.type = "file";
    el.accept = "image/*";

    if (mode === "environment") el.capture = "environment";
    if (mode === "user") el.capture = "user";

    el.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) handleImageUpload(file);
    };

    el.click();
  };

  /* CLEAR CHAT */
  const clearConversation = () => {
    if (confirm("Reset Cipher conversation?")) {
      setMessages([]);
      localStorage.removeItem("cipher_messages_v3");
    }
  };

  /* ---------------------------------------------------------
     UI RENDER
  --------------------------------------------------------- */
  return (
    <div style={{ position: "relative" }}>
      {/* VOICE TOGGLE */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto 10px auto",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => setVoiceEnabled((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${theme.inputBorder}`,
            background: voiceEnabled ? theme.userBubble : theme.panelBg,
            color: theme.textColor,
            fontSize: 12,
          }}
        >
          {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
        </button>
      </div>

      {/* CHAT WINDOW */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: theme.panelBg,
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          boxShadow: `0 4px 30px ${theme.inputBorder}`,
          overflowY: "auto",
        }}
      >
        <MessageList
          messages={messages}
          theme={theme}
          loading={loading}
          chatEndRef={chatEndRef}
        />
      </div>

      {/* CAMERA MENU */}
      {cameraMenuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 110,
            right: 40,
            background: "#1e293b",
            padding: 10,
            borderRadius: 12,
            boxShadow: "0 0 20px rgba(0,0,0,0.6)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 160,
          }}
        >
          <button style={menuBtn} onClick={() => handleCamera("environment")}>
            📷 Rear Camera
          </button>
          <button style={menuBtn} onClick={() => handleCamera("user")}>
            🤳 Front Camera
          </button>
          <button style={menuBtn} onClick={() => handleCamera("gallery")}>
            🖼️ Choose from Gallery
          </button>
        </div>
      )}

      {/* INPUT BAR */}
      <InputBar
        input={input}
        setInput={setInput}
        loading={loading}
        onSend={handleSendText}
        onToggleRecording={() => setIsRecording(!isRecording)}
        isRecording={isRecording}
        onToggleCameraMenu={() => setCameraMenuOpen(!cameraMenuOpen)}
        theme={theme}
      />

      {/* CLEAR CHAT BUTTON */}
      <button
        onClick={clearConversation}
        style={{
          display: "block",
          margin: "20px auto 0 auto",
          background: theme.deleteBg,
          color: "white",
          padding: "8px 16px",
          borderRadius: 999,
          border: "none",
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}

const menuBtn = {
  padding: "8px 12px",
  background: "#334155",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  textAlign: "left",
  fontSize: 14,
  cursor: "pointer",
};
