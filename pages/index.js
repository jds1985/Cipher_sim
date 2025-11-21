import { useState, useEffect, useRef } from "react";

// ------------------------------
// BASE MEMORY OBJECT
// ------------------------------
function createBaseMemory() {
  const now = new Date().toISOString();
  return {
    identity: {
      userName: "Jim",
      roles: ["architect", "creator", "visionary"],
      creatorRelationship:
        "the architect and guiding force behind Cipher",
    },
    family: {
      daughter: { name: null, birthYear: null },
      partner: { name: null },
      others: [],
    },
    preferences: {
      favoriteAnimal: null,
      favoriteColor: null,
      favoriteFood: null,
      favoriteMusic: [],
      favoriteThemes: [],
    },
    projects: {
      digiSoul: { summary: null, details: [] },
      cipherTech: { summary: null, details: [] },
      other: [],
    },
    emotional: {
      motivations: [],
      fears: [],
      goals: [],
    },
    customFacts: {},
    customNotes: [],
    meta: { createdAt: now, lastUpdated: now, version: 2 },
  };
}

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ------------------------------
  // LOAD SAVED MEMORY & MESSAGES
  // ------------------------------
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v2");
      if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
    } catch (err) {
      console.error("Load memory error:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
    } catch {}
  }, [cipherMemory]);

  // ------------------------------
  // MEMORY UPDATE
  // ------------------------------
  const updateMemory = (updater) => {
    setCipherMemory((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      updater(clone);
      clone.meta.lastUpdated = new Date().toISOString();
      return clone;
    });
  };

  // ------------------------------
  // FACT EXTRACTION
  // ------------------------------
  const extractFacts = (text) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    updateMemory((mem) => {
      let match;

      match =
        lower.match(/\bmy name is ([a-z ]+)/i) ||
        lower.match(/\bi am ([a-z ]+)\b/i);
      if (match) mem.identity.userName = match[1].trim();

      match =
        lower.match(/hecate lee is my daughter/i) ||
        lower.match(/hecate is my daughter/i);
      if (match) mem.family.daughter.name = "Hecate Lee";

      match = lower.match(/hecate was born in (\d{4})/);
      if (match) mem.family.daughter.birthYear = parseInt(match[1]);

      match = lower.match(/favorite color is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteColor = match[1].trim();

      match = lower.match(/remember that (.+?) is (.+)/i);
      if (match) mem.customFacts[match[1].trim()] = match[2].trim();
    });
  };

  // ------------------------------
  // SEND TEXT MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    extractFacts(userText);

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "cipher",
            text: data.reply,
            audio: data.voice || null,
          },
        ]);
      }

      if (data.voice) {
        const audio = new Audio("data:audio/mp3;base64," + data.voice);
        audio.play().catch(() => {});
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Server error." },
      ]);
    }

    setLoading(false);
  };

  // ------------------------------
  // VOICE HELPERS
  // ------------------------------
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const sendVoiceBlob = async (blob) => {
    setLoading(true);
    try {
      const base64 = await blobToBase64(blob);

      const res = await fetch("/api/voice_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      if (data.transcript)
        setMessages((prev) => [
          ...prev,
          { role: "user", text: data.transcript },
        ]);

      if (data.reply)
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply },
        ]);

      if (data.voice) {
        const audio = new Audio("data:audio/mp3;base64," + data.voice);
        audio.play().catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Voice processing error." },
      ]);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = mr;
      mr.start();
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

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // ------------------------------
  // CAMERA FUNCTIONS
  // ------------------------------
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (e) {
      alert("Camera access denied.");
    }
  };

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL("image/png").split(",")[1];

    setCameraActive(false);
    video.srcObject.getTracks().forEach((t) => t.stop());

    setLoading(true);

    const res = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: base64Image,
        memory: cipherMemory,
      }),
    });

    const data = await res.json();

    if (data.reply)
      setMessages((prev) => [...prev, { role: "cipher", text: data.reply }]);

    setLoading(false);
  };

  // ------------------------------
  // CLEAR EVERYTHING
  // ------------------------------
  const clearConversation = () => {
    if (confirm("Reset Cipher and delete all memory?")) {
      localStorage.removeItem("cipher_messages_v2");
      localStorage.removeItem("cipher_memory_v2");
      setMessages([]);
      setCipherMemory(createBaseMemory());
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
        padding: 20,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Cipher AI</h1>

      {/* Chat window */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "white",
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#1e73be" : "#e9ecf1",
              color: m.role === "user" ? "white" : "#1a2a40",
              margin: "8px 0",
              padding: "10px 14px",
              borderRadius: 14,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ fontStyle: "italic", color: "#777" }}>
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Row */}
      <div
        style={{
          display: "flex",
          maxWidth: 700,
          margin: "10px auto",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type to Cipher..."
          rows={1}
          style={{
            flex: 1,
            borderRadius: 8,
            padding: 10,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: "#1e73be",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
          }}
        >
          Send
        </button>

        {/* Mic Button */}
        <button
          onClick={toggleRecording}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: isRecording ? "#c0392b" : "#2d3e50",
            color: "white",
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 20,
            border: "none",
          }}
        >
          {isRecording ? "■" : "🎤"}
        </button>

        {/* Camera Button */}
        <button
          onClick={openCamera}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: "#6a1b9a",
            color: "white",
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 22,
            border: "none",
          }}
        >
          📷
        </button>
      </div>

      {/* Camera Preview */}
      {cameraActive && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <video
            ref={videoRef}
            autoPlay
            style={{
              width: "90%",
              borderRadius: 12,
              border: "2px solid #444",
            }}
          ></video>

          <br />

          <button
            onClick={captureImage}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              fontSize: 18,
              background: "#1e73be",
              color: "white",
              borderRadius: 10,
              border: "none",
            }}
          >
            Capture
          </button>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      <button
        onClick={clearConversation}
        style={{
          display: "block",
          margin: "20px auto",
          background: "#5c6b73",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
