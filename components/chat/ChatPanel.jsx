// components/chat/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import {
  createBaseMemory,
  extractFactsIntoMemory,
} from "../../logic/memoryCore";

const sendTextToCipher = async ({ text, memory }) => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, userId: "jim", memory }),
    });
    return await res.json();
  } catch {
    return { reply: "API error." };
  }
};

/* ---------------------------------------------------------
   SEND IMAGE (multipart/form-data)
--------------------------------------------------------- */
const sendImageToCipher = async (file) => {
  try {
    const form = new FormData();
    form.append("image", file);

    const res = await fetch("/api/vision_chat", {
      method: "POST",
      body: form, // <-- NO JSON, NO BASE64
    });

    return await res.json();
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
  const chatEndRef = useRef(null);
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cipher_messages_v3");
    if (stored) setMessages(JSON.parse(stored));

    const mem = localStorage.getItem("cipher_memory_v3");
    if (mem) setCipherMemory(JSON.parse(mem));
  }, []);

  useEffect(() => {
    localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = async () => {
    if (!input.trim()) return;

    const txt = input.trim();
    setInput("");

    const newMem = extractFactsIntoMemory(cipherMemory, txt);
    setCipherMemory(newMem);

    setMessages((m) => [...m, { role: "user", text: txt }]);
    setLoading(true);

    const { reply } = await sendTextToCipher({
      text: txt,
      memory: newMem,
    });

    setMessages((m) => [...m, { role: "cipher", text: reply }]);
    setLoading(false);
  };

  /* ---------------------------------------------------------
     IMAGE UPLOAD (raw file)
  --------------------------------------------------------- */
  const handleImageSelect = async (file) => {
    setLoading(true);

    const { reply } = await sendImageToCipher(file);

    setMessages((m) => [...m, { role: "cipher", text: reply }]);
    setLoading(false);
  };

  const triggerImage = (mode) => {
    setCameraMenuOpen(false);

    const el = document.getElementById("cipher-image-input");

    if (mode === "environment") el.capture = "environment";
    if (mode === "user") el.capture = "user";
    if (mode === "gallery") el.capture = undefined;

    el.click();
  };

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
          overflowY: "auto",
        }}
      >
        <MessageList messages={messages} theme={theme} chatEndRef={chatEndRef} />
      </div>

      {/* CAMERA POPUP */}
      {cameraMenuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 110,
            right: 40,
            background: "#1e293b",
            padding: 10,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button onClick={() => triggerImage("environment")}>📷 Rear</button>
          <button onClick={() => triggerImage("user")}>🤳 Front</button>
          <button onClick={() => triggerImage("gallery")}>🖼 Gallery</button>
        </div>
      )}

      <InputBar
        input={input}
        setInput={setInput}
        onSend={handleSendText}
        onImageSelect={handleImageSelect}
        onToggleCameraMenu={() => setCameraMenuOpen((v) => !v)}
        loading={loading}
        theme={theme}
      />

      {/* HIDDEN INPUT */}
      <input
        id="cipher-image-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
        }}
      />
    </div>
  );
}
