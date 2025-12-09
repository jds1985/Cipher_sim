// components/chat/ChatPanel.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import { put } from "@vercel/blob";
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
        userId: "jim",
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
   SEND IMAGE (URL ONLY) → /api/vision_chat
--------------------------------------------- */
const sendVisionUrlToCipher = async ({ imageUrl }) => {
  try {
    const res = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, userId: "jim" }),
    });

    const data = await res.json();
    return { reply: data.reply || "Vision error." };
  } catch (err) {
    console.error("Vision error:", err);
    return { reply: "Vision error." };
  }
};

export default function ChatPanel({ theme }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const chatEndRef = useRef(null);

  /* LOAD SAVED CHAT + MEMORY */
  useEffect(() => {
    try {
      const savedMsgs = localStorage.getItem("cipher_messages_v3");
      if (savedMsgs) setMessages(JSON.parse(savedMsgs));

      const savedMem = localStorage.getItem("cipher_memory_v3");
      if (savedMem) setCipherMemory(JSON.parse(savedMem));

      const savedVoice = localStorage.getItem("cipher_voice_enabled_v2");
      if (savedVoice === "false") setVoiceEnabled(false);
    } catch {}
  }, []);

  /* AUTO SAVE CHAT */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [messages]);

  /* AUTO SAVE MEMORY */
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
     SEND TEXT
  --------------------------------------------------------- */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const text = input.trim();

    const updatedMem = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(updatedMem);

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    const { reply, voice } = await sendTextToCipher({
      text,
      memory: updatedMem,
      voiceEnabled,
    });

    setMessages((prev) => [
      ...prev,
      { role: "cipher", text: reply, voice: voice || null },
    ]);

    setLoading(false);
  };

  /* ---------------------------------------------------------
     HANDLE IMAGE UPLOAD WITH BLOB
  --------------------------------------------------------- */
  const handleImageUpload = async (file) => {
    try {
      setLoading(true);

      // 1) Upload to Vercel Blob (public)
      const blob = await put(`cipher-${Date.now()}.jpg`, file, {
        access: "public",
      });

      const imageUrl = blob.url;

      // Show placeholder
      setMessages((prev) => [
        ...prev,
        { role: "user", text: "[Image sent to Cipher Vision]" },
      ]);

      // 2) Send URL to backend
      const { reply } = await sendVisionUrlToCipher({ imageUrl });

      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: reply },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Vision error occurred." },
      ]);
    }

    setLoading(false);
  };

  /* ---------------------------------------------------------
     CAMERA HANDLING (front, rear, gallery)
  --------------------------------------------------------- */
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

      {/* CHAT PANEL */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: theme.panelBg,
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          boxShadow: `0 4px 30px ${theme.inputBorder}`,
        }}
      >
        <MessageList
          messages={messages}
          loading={loading}
          theme={theme}
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

      {/* CLEAR CHAT */}
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
