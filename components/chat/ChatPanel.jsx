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
    const userId = localStorage.getItem("cipher_userId");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        userId,       // REQUIRED for backend!
        memory,
        voiceEnabled,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { reply: "API error.", voice: null };
    }

    return {
      reply: data.reply || "No response.",
      voice: data.voice || null,
    };
  } catch (err) {
    console.error("API Chat Error:", err);
    return { reply: "API error.", voice: null };
  }
};

/* TEMP VOICE STUB */
const sendVoiceToCipher = async () => ({
  transcript: "[Voice not enabled yet]",
  reply: "Voice pipeline is not enabled in this build.",
  voice: null,
});

/* TEMP IMAGE STUB */
const sendImageToCipher = async () => ({
  reply: "Vision pipeline is not enabled in this build.",
  voice: null,
});

export default function ChatPanel({ theme }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const chatEndRef = useRef(null);

  /* LOAD STORED CHAT & MEMORY */
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

  /* SAVE MESSAGES */
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

  /* SAVE VOICE SETTINGS */
  useEffect(() => {
    try {
      localStorage.setItem(
        "cipher_voice_enabled_v2",
        voiceEnabled ? "true" : "false"
      );
    } catch {}
  }, [voiceEnabled]);

  /* SEND TEXT MESSAGE */
  const handleSendText = async () => {
    if (!input.trim()) return;
    const text = input.trim();

    // Update memory before sending
    const updatedMem = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(updatedMem);

    // Add user message
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

  /* BLOB → BASE64 */
  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result.split(",")[1]);
      r.readAsDataURL(blob);
    });

  /* SEND VOICE */
  const sendVoiceBlob = async (blob) => {
    setLoading(true);
    const base64 = await blobToBase64(blob);

    const { transcript, reply, voice } = await sendVoiceToCipher({
      base64Audio: base64,
      memory: cipherMemory,
      voiceEnabled,
    });

    if (transcript) {
      setMessages((prev) => [...prev, { role: "user", text: transcript }]);
    }

    setMessages((prev) => [
      ...prev,
      { role: "cipher", text: reply, voice: voice || null },
    ]);

    setLoading(false);
  };

  /* RECORDING HANDLERS */
  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) =>
        e.data.size && audioChunksRef.current.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone error.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () =>
    isRecording ? stopRecording() : startRecording();

  /* CAMERA */
  useEffect(() => {
    const setup = async () => {
      if (!cameraActive) {
        videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        videoRef.current.srcObject = stream;
      } catch {
        alert("Camera failed.");
        setCameraActive(false);
      }
    };

    setup();

    return () => {
      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    };
  }, [cameraActive]);

  const openCamera = () => setCameraActive(true);

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/png").split(",")[1];
    video.srcObject?.getTracks().forEach((t) => t.stop());
    video.srcObject = null;

    setCameraActive(false);
    setLoading(true);

    const { reply, voice } = await sendImageToCipher({
      base64Image: base64,
      memory: cipherMemory,
      voiceEnabled,
    });

    setMessages((prev) => [
      ...prev,
      { role: "cipher", text: reply, voice: voice || null },
    ]);

    setLoading(false);
  };

  /* CLEAR CHAT */
  const clearConversation = () => {
    if (confirm("Reset Cipher conversation?")) {
      setMessages([]);
      localStorage.removeItem("cipher_messages_v3");
    }
  };

  /* UI */
  return (
    <>
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

      {/* CAMERA PREVIEW */}
      {cameraActive && (
        <div style={{ maxWidth: 700, margin: "16px auto", textAlign: "center" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", borderRadius: 12 }}
          />
          <button
            onClick={captureImage}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: theme.buttonBg,
              borderRadius: 10,
              color: "white",
            }}
          >
            Capture
          </button>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {/* INPUT BAR */}
      <InputBar
        input={input}
        setInput={setInput}
        loading={loading}
        onSend={handleSendText}
        onToggleRecording={toggleRecording}
        isRecording={isRecording}
        onOpenCamera={openCamera}
        theme={theme}
      />

      {/* DELETE CHAT */}
      <button
        onClick={clearConversation}
        style={{
          display: "block",
          margin: "20px auto",
          background: theme.deleteBg,
          padding: "8px 16px",
          borderRadius: 999,
          color: "white",
        }}
      >
        Delete Conversation
      </button>
    </>
  );
}
