// components/chat/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import {
  createBaseMemory,
  extractFactsIntoMemory,
} from "../../logic/memoryCore";

/* ---------------------------------------------------------
   REAL TEXT CHAT → /api/chat
--------------------------------------------------------- */
const sendTextToCipher = async ({ text, memory, userId }) => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        memory,
        userId,
      }),
    });

    const data = await res.json();
    return {
      reply: data.reply || "No response.",
      voice: data.voice || null,
    };
  } catch (err) {
    console.error("API Chat Error:", err);
    return { reply: "API error.", voice: null };
  }
};

/* ---------------------------------------------------------
   SEND IMAGE → Vision V2 (/api/vision_chat)
--------------------------------------------------------- */
const sendImageToCipher = async ({ base64Image, memory, userId }) => {
  try {
    const res = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Image,
        memory,
        userId,
      }),
    });

    const data = await res.json();
    return {
      reply: data.reply || "No response.",
    };
  } catch (err) {
    console.error("Vision Error:", err);
    return { reply: "Vision error." };
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

  // Camera menu state
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  // TEMP USER ID — later will be real auth
  const userId = "jim";

  /* ---------------------------------------------------------
     LOAD STORED CHAT + MEMORY
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     SAVE MESSAGES
  --------------------------------------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [messages]);

  /* ---------------------------------------------------------
     SAVE MEMORY
  --------------------------------------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v3", JSON.stringify(cipherMemory));
    } catch {}
  }, [cipherMemory]);

  /* ---------------------------------------------------------
     SEND TEXT MESSAGE
  --------------------------------------------------------- */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const text = input.trim();

    // Update local memory first
    const updatedMem = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(updatedMem);

    // Display the user's message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const { reply } = await sendTextToCipher({
        text,
        memory: updatedMem,
        userId,
      });

      setMessages((prev) => [...prev, { role: "cipher", text: reply }]);
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
     IMAGE UPLOAD PIPELINE
  --------------------------------------------------------- */
  const handleImageUpload = async (file) => {
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];

      try {
        const { reply } = await sendImageToCipher({
          base64Image: base64,
          memory: cipherMemory,
          userId,
        });

        setMessages((prev) => [...prev, { role: "cipher", text: reply }]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: "Vision error." },
        ]);
      }

      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  /* ---------------------------------------------------------
     CAMERA MENU HANDLING
  --------------------------------------------------------- */
  const handleCamera = (mode) => {
    setCameraMenuOpen(false);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    // Control camera type
    if (mode === "environment") input.capture = "environment";
    if (mode === "user") input.capture = "user";

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      await handleImageUpload(file);
    };

    input.click();
  };

  /* ---------------------------------------------------------
     CLEAR CHAT
  --------------------------------------------------------- */
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

      {/* DELETE CHAT */}
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
