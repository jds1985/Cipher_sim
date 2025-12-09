// components/chat/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import {
  createBaseMemory,
  extractFactsIntoMemory,
} from "../../logic/memoryCore";

/* ---------------------------------------------
   SEND TEXT
--------------------------------------------- */
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

/* ---------------------------------------------
   SEND IMAGE → BLOB BACKEND
--------------------------------------------- */
const sendImageToCipher = async (base64Image) => {
  try {
    const res = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, userId: "jim" }),
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

  /* LOAD PREVIOUS CHAT */
  useEffect(() => {
    const stored = localStorage.getItem("cipher_messages_v3");
    if (stored) setMessages(JSON.parse(stored));

    const mem = localStorage.getItem("cipher_memory_v3");
    if (mem) setCipherMemory(JSON.parse(mem));
  }, []);

  /* SAVE CHAT */
  useEffect(() => {
    localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* TEXT SEND */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    const newMem = extractFactsIntoMemory(cipherMemory, userText);
    setCipherMemory(newMem);

    setMessages((m) => [...m, { role: "user", text: userText }]);
    setLoading(true);

    const { reply } = await sendTextToCipher({
      text: userText,
      memory: newMem,
    });

    setMessages((m) => [...m, { role: "cipher", text: reply }]);
    setLoading(false);
  };

  /* IMAGE UPLOAD */
  const handleRawImage = async (file) => {
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];

      const { reply } = await sendImageToCipher(base64);

      setMessages((m) => [...m, { role: "cipher", text: reply }]);
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  /* CAMERA MENU → TRIGGER FILE INPUT */
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
          <button onClick={() => triggerImage("environment")}>📷 Rear Camera</button>
          <button onClick={() => triggerImage("user")}>🤳 Front Camera</button>
          <button onClick={() => triggerImage("gallery")}>🖼 Gallery</button>
        </div>
      )}

      {/* INPUT BAR */}
      <InputBar
        input={input}
        setInput={setInput}
        onSend={handleSendText}
        onImageSelect={handleRawImage}
        onToggleRecording={() => {}}
        isRecording={false}
        onToggleCameraMenu={() => setCameraMenuOpen((v) => !v)}
        loading={loading}
        theme={theme}
      />
    </div>
  );
}
