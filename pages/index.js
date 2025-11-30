// pages/index.js

import { useState, useEffect, useRef } from "react";
import ProfilePanel from "../components/ProfilePanel";
import StorePanel from "../components/StorePanel";
import OmniSearchTest from "../components/OmniSearchTest";
import DevicePanel from "../components/DevicePanel";

/* ============================================================
   THEME ENGINE
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
  },
  nebula_purple: {
    background: "radial-gradient(circle at 20% 20%, #3a0ca3, #240046 80%)",
    panelBg: "rgba(30,0,60,0.7)",
    userBubble: "rgba(150,80,255,0.45)",
    cipherBubble: "rgba(70,20,120,0.7)",
    inputBg: "rgba(20,0,40,0.8)",
    inputBorder: "rgba(180,100,255,0.8)",
    buttonBg: "#8b5cf6",
    deleteBg: "#6d28d9",
    textColor: "#f5e9ff",
  },
  midnight_glass: {
    background: "linear-gradient(160deg, #0a0f14 0%, #111a22 100%)",
    panelBg: "rgba(14,24,34,0.65)",
    userBubble: "rgba(50,130,180,0.35)",
    cipherBubble: "rgba(20,35,50,0.5)",
    inputBg: "rgba(10,20,30,0.7)",
    inputBorder: "rgba(50,150,200,0.8)",
    buttonBg: "rgba(50,150,200,0.9)",
    deleteBg: "rgba(80,90,100,0.7)",
    textColor: "#d8f2ff",
  },
  sunset_amber: {
    background: "linear-gradient(180deg, #3a1c00 0%, #120800 100%)",
    panelBg: "rgba(40,15,0,0.7)",
    userBubble: "rgba(255,140,40,0.45)",
    cipherBubble: "rgba(110,45,15,0.55)",
    inputBg: "rgba(30,10,0,0.7)",
    inputBorder: "rgba(255,180,60,0.7)",
    buttonBg: "#f59e0b",
    deleteBg: "#b45309",
    textColor: "#ffe9c7",
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
    },
    family: {
      daughter: { name: null, birthYear: null },
      partner: { name: null },
    },
    preferences: {},
    projects: {
      digiSoul: {},
      cipherTech: {},
    },
    customFacts: {},
    meta: { createdAt: now, lastUpdated: now, version: 2 },
  };
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function Home() {
  const [screen, setScreen] = useState("chat"); // chat | omni
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Panels
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  // Theme
  const [theme, setTheme] = useState(themeStyles.cipher_core);

  /* ============================================================
     Load Messages + Memory
============================================================ */
  useEffect(() => {
    const storedMessages = localStorage.getItem("cipher_messages_v2");
    if (storedMessages) setMessages(JSON.parse(storedMessages));

    const storedMemory = localStorage.getItem("cipher_memory_v2");
    if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
  }, []);

  useEffect(() => {
    localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
  }, [cipherMemory]);

  /* ============================================================
     LOAD PROFILE
============================================================ */
  useEffect(() => {
    const loadProfile = async () => {
      try {
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

        const loadRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", userId }),
        });

        const data = await loadRes.json();
        if (data.profile) setProfile(data.profile);
      } catch (err) {
        console.error("Profile load error:", err);
      }
      setProfileLoading(false);
    };

    loadProfile();
  }, []);

  /* ============================================================
     THEME HANDLING
============================================================ */
  useEffect(() => {
    if (!profile?.currentTheme) {
      setTheme(themeStyles.cipher_core);
      return;
    }
    setTheme(themeStyles[profile.currentTheme] || themeStyles.cipher_core);
  }, [profile?.currentTheme]);

  /* ============================================================
     MESSAGE FACT EXTRACTION
============================================================ */
  const extractFacts = (text) => {
    const lower = text.toLowerCase();
    setCipherMemory((m) => {
      const out = structuredClone(m);

      let match;

      match = lower.match(/\bmy name is ([a-z ]+)/i);
      if (match) out.identity.userName = match[1].trim();

      match = lower.match(/hecate (lee )?is my daughter/);
      if (match) out.family.daughter.name = "Hecate Ajna Lee";

      match = lower.match(/favorite color is ([a-z ]+)/i);
      if (match) out.preferences.favoriteColor = match[1].trim();

      out.meta.lastUpdated = new Date().toISOString();
      return out;
    });
  };

  /* ============================================================
     SEND MESSAGE (TEXT)
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
        body: JSON.stringify({
          message: text,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "cipher", text: data.reply }]);
      }

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice).play().catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setMessages((p) => [...p, { role: "cipher", text: "Server error." }]);
    }

    setLoading(false);
  };

  /* ============================================================
     VOICE RECORDING
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
        setMessages((prev) => [...prev, { role: "user", text: data.transcript }]);
      }

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "cipher", text: data.reply }]);
      }

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice).play().catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "cipher", text: "Voice error." }]);
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

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        sendVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
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

  /* ============================================================
     CAMERA CAPTURE
============================================================ */
  useEffect(() => {
    if (!cameraActive) return;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Camera denied.");
        setCameraActive(false);
      }
    };

    start();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive]);

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/png").split(",")[1];
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
        setMessages((p) => [...p, { role: "cipher", text: data.reply }]);
      }

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice)
          .play()
          .catch(() => {});
      }
    } catch (err) {
      setMessages((p) => [...p, { role: "cipher", text: "Vision error." }]);
    }
    setLoading(false);
  };

  /* ============================================================
     CLEAR CHAT
============================================================ */
  const clearConversation = () => {
    if (confirm("Clear conversation?")) {
      setMessages([]);
      localStorage.removeItem("cipher_messages_v2");
    }
  };

  /* ============================================================
     SCREEN SWITCH — OMNI VIEW
============================================================ */
  if (screen === "omni") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.background,
          padding: 20,
          color: theme.textColor,
        }}
      >
        <button
          onClick={() => setScreen("chat")}
          style={{
            marginBottom: 20,
            padding: "8px 14px",
            borderRadius: 10,
            background: theme.userBubble,
            color: theme.textColor,
            border: "none",
          }}
        >
          ← Back
        </button>

        <OmniSearchTest />
      </div>
    );
  }

  /* ============================================================
     DEFAULT CHAT UI
============================================================ */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        padding: 20,
        color: theme.textColor,
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto 10px auto",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>Cipher AI</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.panelBg,
              color: theme.textColor,
            }}
          >
            ⚙ Menu
          </button>

          <button
            onClick={() => setScreen("omni")}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.panelBg,
              color: theme.textColor,
            }}
          >
            🔍 Omni
          </button>

          <button
            onClick={() => setDeviceOpen(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.panelBg,
              color: theme.textColor,
            }}
          >
            📱 Device
          </button>
        </div>
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
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            {/* Message Bubble */}
            <div
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background:
                  m.role === "user" ? theme.userBubble : theme.cipherBubble,
                color: theme.textColor,
                marginBottom: 6,
                padding: "10px 14px",
                borderRadius: 14,
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>

            {/* 📱 Send to Device button */}
            {m.role === "cipher" &&
              m.text.length > 0 &&
              m.text.length < 350 && (
                <button
                  onClick={() => {
                    setDraftMessage(m.text);
                    setDeviceOpen(true);
                  }}
                  style={{
                    marginLeft: 6,
                    padding: "6px 12px",
                    background: theme.userBubble,
                    color: "white",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 12,
                  }}
                >
                  📱 Send this to Device
                </button>
              )}
          </div>
        ))}

        {loading && <div>Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      {/* CAMERA */}
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
            }}
          />
          <button
            onClick={captureImage}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              borderRadius: 10,
              background: theme.buttonBg,
              color: "white",
              border: "none",
            }}
          >
            Capture
          </button>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {/* INPUT */}
      <div
        style={{
          maxWidth: 700,
          margin: "20px auto 0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="Type to Cipher..."
          style={{
            width: "100%",
            borderRadius: 10,
            padding: "10px 14px",
            border: `1px solid ${theme.inputBorder}`,
            background: theme.inputBg,
            color: theme.textColor,
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={sendMessage}
            style={{
              flex: 1,
              background: theme.buttonBg,
              color: "white",
              padding: "10px 16px",
              borderRadius: 999,
              border: "none",
              fontWeight: 600,
            }}
          >
            Send
          </button>

          {/* MIC */}
          <button
            onClick={toggleRecording}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: isRecording ? "#b91c1c" : theme.cipherBubble,
              color: "white",
              border: "none",
            }}
          >
            {isRecording ? "■" : "🎤"}
          </button>

          {/* CAMERA */}
          <button
            onClick={() => setCameraActive(true)}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: theme.userBubble,
              color: "white",
              border: "none",
            }}
          >
            📷
          </button>
        </div>
      </div>

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

      {/* PANELS */}
      {menuOpen && (
        <ProfilePanel
          profile={profile}
          loading={profileLoading}
          onClose={() => setMenuOpen(false)}
          onProfileChange={(u) =>
            setProfile((prev) => ({ ...(prev || {}), ...u }))
          }
          onOpenStore={() => {
            setMenuOpen(false);
            setStoreOpen(true);
          }}
        />
      )}

      {storeOpen && (
        <StorePanel
          currentThemeKey={profile?.currentTheme || "cipher_core"}
          onClose={() => setStoreOpen(false)}
          onPreviewTheme={(k) => setTheme(themeStyles[k])}
          onApplyTheme={(k) =>
            setProfile((prev) => ({ ...(prev || {}), currentTheme: k }))
          }
        />
      )}

      {/* DEVICE PANEL */}
      {deviceOpen && (
        <DevicePanel
          prefillMessage={draftMessage}
          onClose={() => setDeviceOpen(false)}
        />
      )}
    </div>
  );
}
