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
const sendTextToCipher = async ({ text, memory }) => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, userId: "jim", memory }),
    });

    const data = await res.json();
    return { reply: data.reply || "No response." };
  } catch (err) {
    console.error("API Chat Error:", err);
    return { reply: "API error." };
  }
};

/* ---------------------------------------------
   SEND IMAGE → /api/vision_chat
--------------------------------------------- */
const sendImageToCipher = async (base64Image) => {
  try {
    const res = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, userId: "jim" }),
    });

    const data = await res.json();
    return { reply: data.reply || "Vision error." };
  } catch (err) {
    console.error("Vision Error:", err);
    return { reply: "Vision error." };
  }
};

/* ---------------------------------------------
   CLIENT-SIDE IMAGE COMPRESSION
   - Shrinks huge camera photos BEFORE upload
--------------------------------------------- */
const compressImageInBrowser = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxWidth = 800; // target width
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;

          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // JPEG at 0.7 quality → usually < 500KB
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          const base64 = compressedDataUrl.split(",")[1];
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ChatPanel({ theme }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const chatEndRef = useRef(null);
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  /* LOAD PREVIOUS CHAT + MEMORY */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cipher_messages_v3");
      if (stored) setMessages(JSON.parse(stored));

      const mem = localStorage.getItem("cipher_memory_v3");
      if (mem) setCipherMemory(JSON.parse(mem));
    } catch (err) {
      console.error("Load localStorage error:", err);
    }
  }, []);

  /* SAVE CHAT */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Save messages error:", err);
    }
  }, [messages]);

  /* SAVE MEMORY */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v3", JSON.stringify(cipherMemory));
    } catch (err) {
      console.error("Save memory error:", err);
    }
  }, [cipherMemory]);

  /* ---------------------------------------------
     TEXT SEND
  --------------------------------------------- */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    // update memory
    const newMem = extractFactsIntoMemory(cipherMemory, userText);
    setCipherMemory(newMem);

    // show user message
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setLoading(true);

    const { reply } = await sendTextToCipher({
      text: userText,
      memory: newMem,
    });

    setMessages((m) => [...m, { role: "cipher", text: reply }]);
    setLoading(false);
  };

  /* ---------------------------------------------
     IMAGE HANDLER (with compression)
  --------------------------------------------- */
  const handleRawImage = async (file) => {
    if (!file) return;
    setLoading(true);

    try {
      // 1) Compress locally
      const base64 = await compressImageInBrowser(file);

      // 2) Send compressed base64 to backend
      const { reply } = await sendImageToCipher(base64);

      setMessages((m) => [
        ...m,
        { role: "cipher", text: reply || "Vision error." },
      ]);
    } catch (err) {
      console.error("Vision pipeline error:", err);
      setMessages((m) => [
        ...m,
        { role: "cipher", text: "Vision error." },
      ]);
    }

    setLoading(false);
  };

  /* CAMERA MENU → TRIGGER FILE INPUT */
  const triggerImage = (mode) => {
    setCameraMenuOpen(false);

    const el = document.getElementById("cipher-image-input");
    if (!el) return;

    if (mode === "environment") el.capture = "environment";
    else if (mode === "user") el.capture = "user";
    else el.capture = undefined; // gallery

    el.click();
  };

  /* CLEAR CHAT (if you want to hook to a button later) */
  const clearConversation = () => {
    if (confirm("Reset Cipher conversation?")) {
      setMessages([]);
      localStorage.removeItem("cipher_messages_v3");
    }
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
        <MessageList
          messages={messages}
          theme={theme}
          chatEndRef={chatEndRef}
        />
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
            boxShadow: "0 0 20px rgba(0,0,0,0.6)",
          }}
        >
          <button onClick={() => triggerImage("environment")}>
            📷 Rear Camera
          </button>
          <button onClick={() => triggerImage("user")}>🤳 Front Camera</button>
          <button onClick={() => triggerImage("gallery")}>🖼 Gallery</button>
        </div>
      )}

      {/* INPUT BAR */}
      <InputBar
        input={input}
        setInput={setInput}
        loading={loading}
        onSend={handleSendText}
        onImageSelect={handleRawImage}
        onToggleRecording={() => {}}
        isRecording={false}
        onToggleCameraMenu={() => setCameraMenuOpen((v) => !v)}
        theme={theme}
      />
    </div>
  );
}
