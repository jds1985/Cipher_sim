// components/chat/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import {
  createBaseMemory,
  extractFactsIntoMemory,
} from "../../logic/memoryCore";

export default function ChatPanel({ theme }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const chatEndRef = useRef(null);

  /* ---------------------------------------------
     LOAD SAVED CHAT + MEMORY
  --------------------------------------------- */
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v3");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v3");
      if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
    } catch {}
  }, []);

  /* ---------------------------------------------
     AUTO SAVE CHAT + AUTOSCROLL
  --------------------------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [messages]);

  /* ---------------------------------------------
     SAVE MEMORY
  --------------------------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v3", JSON.stringify(cipherMemory));
    } catch {}
  }, [cipherMemory]);

  /* ---------------------------------------------
     SEND TEXT → /api/chat
  --------------------------------------------- */
  const handleSendText = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    // Update memory
    const updatedMemory = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(updatedMemory);

    // Push user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId: "jim",
          memory: updatedMemory,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: data.reply || "No response." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "cipher", text: "API error." }]);
    }

    setLoading(false);
  };

  /* ---------------------------------------------
     NEW IMAGE UPLOAD → Upload to Vercel → Send URL
  --------------------------------------------- */
  const handleImageUpload = async (file) => {
    try {
      setLoading(true);

      // 1. Upload file to Vercel Blob via Upload API
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("https://upload.vercel.com/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_VERCEL_BLOB_TOKEN}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.url) {
        throw new Error("Upload failed");
      }

      const imageUrl = uploadData.url;

      // 2. Send URL to /api/image_analyze
      const res = await fetch("/api/image_analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageUrl,
          userId: "jim",
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: data.reply || "Vision failed." },
      ]);
    } catch (err) {
      console.error("Image upload error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Image analysis failed." },
      ]);
    }

    setLoading(false);
  };

  /* ---------------------------------------------
     CLEAR CHAT
  --------------------------------------------- */
  const clearConversation = () => {
    if (confirm("Reset Cipher conversation?")) {
      setMessages([]);
      localStorage.removeItem("cipher_messages_v3");
    }
  };

  /* ---------------------------------------------
     RENDER UI
  --------------------------------------------- */
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
          boxShadow: `0 2px 20px ${theme.inputBorder}`,
        }}
      >
        <MessageList
          messages={messages}
          theme={theme}
          loading={loading}
          chatEndRef={chatEndRef}
        />
      </div>

      {/* INPUT BAR */}
      <InputBar
        input={input}
        setInput={setInput}
        loading={loading}
        onSend={handleSendText}
        onImageUpload={handleImageUpload}
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
