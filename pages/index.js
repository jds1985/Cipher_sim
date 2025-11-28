// pages/index.js
import { useState, useEffect, useRef } from "react";
import ProfilePanel from "../components/ProfilePanel";

/* ============================================================
   THEME ENGINE (UPGRADED)
============================================================ */
const themeStyles = {
  cipher_core: {
    background: "#050816",
    panelBg: "#111827",
    userBubble: "#1d4ed8",
    cipherBubble: "#1f2937",
    inputBg: "#020617",
    inputBorder: "#4b5563",
    buttonBg: "#1d4ed8",
    deleteBg: "#4b5563",
    textColor: "#e5e7eb",
    glow: "0 0 18px rgba(59,130,246,0.45)",
  },

  nebula_purple: {
    background: "radial-gradient(circle at 20% 20%, #3a0ca3, #240046 80%)",
    panelBg: "rgba(30,0,60,0.8)",
    userBubble: "rgba(150,80,255,0.55)",
    cipherBubble: "rgba(60,20,110,0.75)",
    inputBg: "rgba(20,0,40,0.9)",
    inputBorder: "rgba(192,132,252,0.9)",
    buttonBg: "#8b5cf6",
    deleteBg: "#6d28d9",
    textColor: "#f5e9ff",
    glow: "0 0 22px rgba(168,85,247,0.75)",
  },

  midnight_glass: {
    background: "linear-gradient(160deg, #0a0f14 0%, #111a22 100%)",
    panelBg: "rgba(14,24,34,0.8)",
    userBubble: "rgba(50,130,180,0.45)",
    cipherBubble: "rgba(20,35,50,0.55)",
    inputBg: "rgba(10,20,30,0.9)",
    inputBorder: "rgba(96,165,250,0.85)",
    buttonBg: "rgba(56,189,248,0.9)",
    deleteBg: "rgba(75,85,99,0.8)",
    textColor: "#d8f2ff",
    glow: "0 0 20px rgba(59,130,246,0.65)",
  },

  sunset_amber: {
    background: "linear-gradient(180deg, #3a1c00 0%, #120800 100%)",
    panelBg: "rgba(40,15,0,0.85)",
    userBubble: "rgba(255,140,40,0.6)",
    cipherBubble: "rgba(120,45,15,0.65)",
    inputBg: "rgba(30,10,0,0.9)",
    inputBorder: "rgba(251,191,36,0.85)",
    buttonBg: "#f59e0b",
    deleteBg: "#b45309",
    textColor: "#ffe9c7",
    glow: "0 0 20px rgba(251,191,36,0.7)",
  },
};

/* ============================================================
   BASE MEMORY OBJECT
============================================================ */
function createBaseMemory() {
  const now = new Date().toISOString();
  return {
    identity: {
      userName: "Jim",
      roles: ["architect", "creator", "visionary"],
      creatorRelationship: "the architect and guiding force behind Cipher",
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

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Local memory system
  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Profile + theme
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(themeStyles.cipher_core);

  /* ============================================================
     LOAD LOCAL MEMORY + MESSAGES
  ============================================================ */
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v2");
      if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
    } catch {
      // ignore
    }
  }, [cipherMemory]);

  /* ============================================================
     LOAD PROFILE (POST action API)
  ============================================================ */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 1 — get or create userId
        let userId = localStorage.getItem("cipher_userId");

        if (!userId) {
          const newRes = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "newId" }),
          });
          const newData = await newRes.json();
          userId = newData.userId;
          localStorage.setItem("cipher_userId", userId);
        }

        // 2 — load profile
        const loadRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", userId }),
        });

        const data = await loadRes.json();
        if (data.profile) setProfile(data.profile);
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  /* ============================================================
     SAVE PROFILE
  ============================================================ */
  const updateProfile = async (updates) => {
    setProfile((prev) => ({ ...(prev || {}), ...updates }));

    try {
      const userId = localStorage.getItem("cipher_userId");
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          userId,
          updates,
        }),
      });
    } catch (err) {
      console.error("Profile save error:", err);
    }
  };

  /* ============================================================
     LIVE THEME ENGINE
  ============================================================ */
  useEffect(() => {
    if (!profile?.currentTheme) return;
    const next =
      themeStyles[profile.currentTheme] || themeStyles.cipher_core;
    setTheme(next);
  }, [profile?.currentTheme]);

  /* ============================================================
     MEMORY EXTRACTION
  ============================================================ */
  const updateMemory = (fn) => {
    setCipherMemory((prev) => {
      const clone = structuredClone(prev);
      fn(clone);
      clone.meta.lastUpdated = new Date().toISOString();
      return clone;
    });
  };

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

  /* ============================================================
     TEXT CHAT
  ============================================================ */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    extractFacts(text);

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, memory: cipherMemory }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply },
        ]);
      }
      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice)
          .play()
          .catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Server error." },
      ]);
    }

    setLoading(false);
  };

  /* ============================================================
     VOICE HANDLERS
  ============================================================ */
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
        body: JSON.stringify({ audio: base64, memory: cipherMemory }),
      });

      const data = await res.json();

      if (data.transcript) {
        setMessages((prev) => [
          ...prev,
          { role: "user", text: data.transcript },
        ]);
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply },
        ]);
      }

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice)
          .play()
          .catch(() => {});
      }
    } catch {
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
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

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  /* ============================================================
     CAMERA / VISION
  ============================================================ */
  useEffect(() => {
    const setupStream = async () => {
      if (!cameraActive) {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach((t) => t.stop());
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
      const res = await fetch("/api/vision_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, memory: cipherMemory }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply },
        ]);
      }

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice)
          .play()
          .catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Vision processing error." },
      ]);
    }

    setLoading(false);
  };

  /* ============================================================
     CLEAR
  ============================================================ */
  const clearConversation = () => {
    if (!confirm("Reset Cipher chat and local memory?")) return;
    setMessages([]);
    setCipherMemory(createBaseMemory());
    localStorage.removeItem("cipher_messages_v2");
    localStorage.removeItem("cipher_memory_v2");
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        padding: 20,
        fontFamily: "Inter, sans-serif",
        color: theme.textColor,
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto 10px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Cipher AI</h1>

        <button
          onClick={() => setMenuOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            border: `1px solid ${theme.inputBorder}`,
            background: theme.panelBg,
            color: theme.textColor,
            fontSize: 13,
            boxShadow: theme.glow,
          }}
        >
          <span style={{ fontSize: 14 }}>⚙</span>
          <span>Menu</span>
        </button>
      </div>

      {/* CHAT PANEL */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: theme.panelBg,
          borderRadius: 16,
          padding: 20,
          minHeight: "60vh",
          boxShadow: theme.glow,
          transition: "background 0.3s ease",
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              background:
                m.role === "user" ? theme.userBubble : theme.cipherBubble,
              color: theme.textColor,
              margin: "8px 0",
              padding: "10px 14px",
              borderRadius: 14,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              transition: "background 0.3s ease",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ fontStyle: "italic", opacity: 0.7 }}>
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT + CONTROLS */}
      <div
        style={{
          maxWidth: 700,
          margin: "16px auto 0 auto",
        }}
      >
        {/* TEXTAREA (full width) */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type to Cipher…"
          rows={3}
          style={{
            width: "100%",
            borderRadius: 12,
            padding: "10px 14px",
            border: `1px solid ${theme.inputBorder}`,
            background: theme.inputBg,
            color: theme.textColor,
            outline: "none",
            boxShadow: theme.glow,
            resize: "none",
          }}
        />

        {/* SEND BUTTON (full width under input) */}
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 10,
            background: theme.buttonBg,
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            fontWeight: 600,
            letterSpacing: 0.4,
            boxShadow: theme.glow,
          }}
        >
          Send
        </button>

        {/* MIC + CAMERA ROW */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 10,
          }}
        >
          <button
            onClick={toggleRecording}
            disabled={loading}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: isRecording ? "#b91c1c" : theme.cipherBubble,
              color: "#fff",
              fontSize: 20,
              boxShadow: theme.glow,
            }}
          >
            {isRecording ? "■" : "🎤"}
          </button>

          <button
            onClick={openCamera}
            disabled={loading}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: cameraActive ? "#b91c1c" : theme.userBubble,
              color: "#fff",
              fontSize: 20,
              boxShadow: theme.glow,
            }}
          >
            📷
          </button>
        </div>
      </div>

      {/* CAMERA PREVIEW */}
      {cameraActive && (
        <div
          style={{
            maxWidth: 700,
            margin: "18px auto 0 auto",
            textAlign: "center",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              borderRadius: 16,
              border: `1px solid ${theme.inputBorder}`,
              boxShadow: theme.glow,
            }}
          />

          <button
            onClick={captureImage}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: theme.buttonBg,
              color: "#fff",
              borderRadius: 999,
              border: "none",
              boxShadow: theme.glow,
            }}
          >
            Capture & Send to Cipher
          </button>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

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

      {/* PROFILE / MENU PANEL */}
      {menuOpen && (
        <ProfilePanel
          profile={profile}
          loading={profileLoading}
          onClose={() => setMenuOpen(false)}
          onProfileChange={updateProfile}
        />
      )}
    </div>
  );
}
