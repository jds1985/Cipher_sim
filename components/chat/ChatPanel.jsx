// components/chat/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import { createBaseMemory, extractFactsIntoMemory } from "../../logic/memoryCore";
import { sendTextToCipher } from "../../logic/chatCore";
import { sendVoiceToCipher } from "../../logic/voiceCore";
import { sendImageToCipher } from "../../logic/visionCore";

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

  // Load persisted stuff
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

  // Save messages
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v3", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [messages]);

  // Save memory
  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v3", JSON.stringify(cipherMemory));
    } catch {}
  }, [cipherMemory]);

  // Save voice toggle
  useEffect(() => {
    try {
      localStorage.setItem(
        "cipher_voice_enabled_v2",
        voiceEnabled ? "true" : "false"
      );
    } catch {}
  }, [voiceEnabled]);

  // TEXT SEND
  const handleSendText = async () => {
    if (!input.trim()) return;
    const text = input.trim();

    // update memory
    const updatedMem = extractFactsIntoMemory(cipherMemory, text);
    setCipherMemory(updatedMem);

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

  // VOICE HELPERS
  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result.split(",")[1]);
      r.readAsDataURL(blob);
    });

  const sendVoiceBlob = async (blob) => {
    setLoading(true);
    try {
      const base64 = await blobToBase64(blob);
      const { transcript, reply, voice } = await sendVoiceToCipher({
        base64Audio: base64,
        memory: cipherMemory,
        voiceEnabled,
      });

      if (transcript) {
        setMessages((prev) => [...prev, { role: "user", text: transcript }]);
      }

      if (reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: reply, voice: voice || null },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Voice error." },
      ]);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone error.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // CAMERA
  useEffect(() => {
    const setupStream = async () => {
      if (!cameraActive) {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks?.forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        alert("Camera denied or failed to start.");
        setCameraActive(false);
      }
    };

    setupStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraActive]);

  const openCamera = () => setCameraActive(true);

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      alert("Camera not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/png").split(",")[1];

    if (video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
    setLoading(true);

    try {
      const { reply, voice } = await sendImageToCipher({
        base64Image: base64,
        memory: cipherMemory,
        voiceEnabled,
      });

      if (reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: reply, voice: voice || null },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Vision processing error." },
      ]);
    }

    setLoading(false);
  };

  const clearConversation = () => {
    if (confirm("Reset Cipher conversation?")) {
      setMessages([]);
      try {
        localStorage.removeItem("cipher_messages_v3");
      } catch {}
    }
  };

  return (
    <>
      {/* Voice toggle inside chat panel */}
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
            boxShadow: "0 0 12px rgba(148,163,184,0.4)",
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
          transition: "background 0.3s ease",
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
        <div
          style={{
            maxWidth: 700,
            margin: "16px auto 0 auto",
            textAlign: "center",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              borderRadius: 12,
              border: `2px solid ${theme.inputBorder}`,
            }}
          />
          <button
            onClick={captureImage}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: theme.buttonBg,
              color: "white",
              borderRadius: 10,
              border: "none",
              fontSize: 16,
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

      {/* DELETE */}
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
    </>
  );
}
