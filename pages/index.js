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
        "the architect and guiding force behind Cipher"
    },
    family: {
      daughter: { name: null, birthYear: null },
      partner: { name: null },
      others: []
    },
    preferences: {
      favoriteAnimal: null,
      favoriteColor: null,
      favoriteFood: null,
      favoriteMusic: [],
      favoriteThemes: []
    },
    projects: {
      digiSoul: { summary: null, details: [] },
      cipherTech: { summary: null, details: [] },
      other: []
    },
    emotional: {
      motivations: [],
      fears: [],
      goals: []
    },
    customFacts: {},
    customNotes: [],
    meta: { createdAt: now, lastUpdated: now, version: 2 }
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
  // LOAD LOCAL MEMORY
  // ------------------------------
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v2");
      if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
    } catch {}
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
  const updateMemory = (fn) => {
    setCipherMemory((prev) => {
      const clone = structuredClone(prev);
      fn(clone);
      clone.meta.lastUpdated = new Date().toISOString();
      return clone;
    });
  };

  // ------------------------------
  // EXTRACT FACTS
  // ------------------------------
  const extractFacts = (text) => {
    const lower = text.toLowerCase();

    updateMemory((mem) => {
      let m;

      m = lower.match(/\bmy name is ([a-z ]+)/i);
      if (m) mem.identity.userName = m[1].trim();

      m = lower.match(/hecate (lee )?is my daughter/i);
      if (m) mem.family.daughter.name = "Hecate Lee";

      m = lower.match(/hecate was born in (\d{4})/);
      if (m) mem.family.daughter.birthYear = parseInt(m[1]);

      m = lower.match(/favorite color is ([a-z ]+)/i);
      if (m) mem.preferences.favoriteColor = m[1].trim();

      m = lower.match(/remember that (.+?) is (.+)/i);
      if (m) mem.customFacts[m[1].trim()] = m[2].trim();
    });
  };

  // ------------------------------
  // SEND TEXT MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    extractFacts(text);

    setMessages((p) => [...p, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, memory: cipherMemory })
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((p) => [...p, { role: "cipher", text: data.reply }]);
      }

      if (data.voice) {
        const audio = new Audio("data:audio/mp3;base64," + data.voice);
        audio.play().catch(() => {});
      }
    } catch {
      setMessages((p) => [...p, { role: "cipher", text: "Server error." }]);
    }

    setLoading(false);
  };

  // ------------------------------
  // VOICE HANDLERS
  // ------------------------------
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

      const res = await fetch("/api/voice_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, memory: cipherMemory })
      });

      const data = await res.json();

      if (data.transcript) {
        setMessages((p) => [...p, { role: "user", text: data.transcript }]);
      }

      if (data.reply) {
        setMessages((p) => [...p, { role: "cipher", text: data.reply }]);
      }

      if (data.voice) {
        const audio = new Audio("data:audio/mp3;base64," + data.voice);
        audio.play().catch(() => {});
      }
    } catch {
      setMessages((p) => [...p, { role: "cipher", text: "Voice error." }]);
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

  // ------------------------------
  // CAMERA SYSTEM
  // ------------------------------
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      alert("Camera denied.");
    }
  };

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/png").split(",")[1];

    video.srcObject.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
    setLoading(true);

    const res = await fetch("/api/vision_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, memory: cipherMemory })
    });

    const data = await res.json();

    if (data.reply) {
      setMessages((p) => [...p, { role: "cipher", text: data.reply }]);
    }

    setLoading(false);
  };

  // ------------------------------
  // TEST CAMERA PERMISSIONS (NEW)
  // ------------------------------
  const testCamera = async () => {
    try {
      const permissions = await navigator.permissions.query({
        name: "camera"
      });

      alert("Camera permission state: " + permissions.state);
    } catch {
      alert("Camera permission not available on this browser.");
    }
  };

  // ------------------------------
  // CLEAR
  // ------------------------------
  const clearConversation = () => {
    if (confirm("Reset Cipher entirely?")) {
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
        fontFamily: "Inter, sans-serif"
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Cipher AI</h1>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "white",
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          overflowY: "auto"
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
              whiteSpace: "pre-wrap"
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

      {/* INPUT BAR */}
      <div
        style={{
          display: "flex",
          maxWidth: 700,
          margin: "10px auto"
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
            border: "1px solid #ccc"
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
            border: "none"
          }}
        >
          Send
        </button>

        {/* MIC */}
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
            border: "none"
          }}
        >
          {isRecording ? "■" : "🎤"}
        </button>

        {/* CAMERA */}
        <button
          onClick={openCamera}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: cameraActive ? "#c0392b" : "#6a1b9a",
            color: "white",
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 22,
            border: "none"
          }}
        >
          📷
        </button>

        {/* TEST CAMERA (NEW BUTTON) */}
        <button
          onClick={testCamera}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: "#34495e",
            color: "white",
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 20,
            border: "none"
          }}
        >
          🧪
        </button>
      </div>

      {/* CAMERA PREVIEW */}
      {cameraActive && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <video
            ref={videoRef}
            autoPlay
            style={{
              width: "90%",
              borderRadius: 12,
              border: "2px solid #444"
            }}
          />

          <button
            onClick={captureImage}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: "#1e73be",
              color: "white",
              borderRadius: 10,
              border: "none",
              fontSize: 18
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
          border: "none"
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
