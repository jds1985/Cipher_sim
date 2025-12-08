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
const sendTextToCipher = async ({ text, memory, voiceEnabled }) => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        userId: "jim",        // *** REQUIRED FIX ***
        memory,
        voiceEnabled,
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
   TEMP STUBS FOR VOICE + IMAGE
--------------------------------------------------------- */
const sendVoiceToCipher = async () => {
  return {
    transcript: "[Voice not enabled yet]",
    reply: "Voice pipeline not enabled in this build.",
    voice: null,
  };
};

const sendImageToCipher = async ({ base64Image }) => {
  return {
    reply: "Vision pipeline not enabled yet.",
    voice: null,
  };
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

  /* ---------------------------------------------------------
     LOAD STORED CHAT + MEMORY (local)
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
     SAVE VOICE STATE
  --------------------------------------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem(
        "cipher_voice_enabled_v2",
        voiceEnabled ? "true" : "false"
      );
    } catch {}
  }, [voiceEnabled]);

  /* ---------------------------------------------------------
     TEXT SEND HANDLER
  --------------------------------------------------------- */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const text = input.trim();

    // Update memory context first
    const updatedMem = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(updatedMem);

    // Add user message to UI
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
     IMAGE UPLOAD PIPELINE
  --------------------------------------------------------- */
  const handleImageUpload = async (file) => {
    setLoading(true);

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];

      try {
        const { reply, voice } = await sendImageToCipher({
          base64Image: base64,
          memory: cipherMemory,
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
          { role: "cipher", text: "Vision error." },
        ]);
      }

      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  /* ---------------------------------------------------------
     CAMERA HANDLING
  --------------------------------------------------------- */
  const handleCamera = (mode) => {
    setCameraMenuOpen(false);

    const el = document.createElement("input");
    el.type = "file";
    el.accept = "image/*";

    if (mode === "environment") el.capture = "environment";
    else if (mode === "user") el.capture = "user";

    el.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleImageUpload(file);
    };

    el.click();
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

/* shared button style */
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
