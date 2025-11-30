// pages/index.js
import { useState, useEffect, useRef } from "react";
import ProfilePanel from "../components/ProfilePanel";
import StorePanel from "../components/StorePanel";
import OmniSearchTest from "../components/OmniSearchTest";
import DevicePanel from "../components/DevicePanel";

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
  // Screens: chat | omni | device
  const [screen, setScreen] = useState("chat");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Camera / vision
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Profile & panels
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  // Device panel as its own screen (for now)
  const [theme, setTheme] = useState(themeStyles.cipher_core);
  const [userId, setUserId] = useState(null); // used by context bridge + chat

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
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      // ignore localStorage errors
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
    } catch {
      // ignore localStorage errors
    }
  }, [cipherMemory]);

  /* ============================================================
     LOAD PROFILE (AND USER ID)
  ============================================================ */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let id = localStorage.getItem("cipher_userId");

        if (!id) {
          const newRes = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "newId" }),
          });
          const newData = await newRes.json();
          id = newData.userId;
          localStorage.setItem("cipher_userId", id);
        }

        setUserId(id);

        const loadRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", userId: id }),
        });

        const data = await loadRes.json();
        if (data.profile) {
          setProfile(data.profile);
        }
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
      const id = userId || localStorage.getItem("cipher_userId");
      if (!id) return;

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          userId: id,
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
    if (!profile?.currentTheme) {
      setTheme(themeStyles.cipher_core);
      return;
    }
    setTheme(themeStyles[profile.currentTheme] || themeStyles.cipher_core);
  }, [profile?.currentTheme]);

  const previewTheme = (themeKey) => {
    setTheme(themeStyles[themeKey] || themeStyles.cipher_core);
  };

  const applyTheme = (themeKey) => {
    updateProfile({ currentTheme: themeKey });
  };

  /* ============================================================
     MEMORY EXTRACTION
  ============================================================ */
  const updateMemory = (fn) => {
    setCipherMemory((prev) => {
      const base = prev || createBaseMemory();
      const clone =
        typeof structuredClone === "function"
          ? structuredClone(base)
          : JSON.parse(JSON.stringify(base));
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
     CHAT — TEXT (DEEP MODE + POSSIBLE VOICE)
  ============================================================ */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    extractFacts(text);

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const body = {
        message: text,
        memory: cipherMemory,
        userId: userId || "jim_default",
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "cipher", text: data.reply }]);
      }

      // Be robust to either `voice` or `audio` keys coming back from backend
      const voiceBase64 = data.voice || data.audio;
      if (voiceBase64) {
        new Audio("data:audio/mp3;base64," + voiceBase64)
          .play()
          .catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Server error." },
      ]);
    }

    setLoading(false);
  };

  /* ============================================================
     VOICE — RECORDING HANDLERS
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
        body: JSON.stringify({
          audio: base64,
          memory: cipherMemory,
          userId: userId || "jim_default",
        }),
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

      const voiceBase64 = data.voice || data.audio;
      if (voiceBase64) {
        new Audio("data:audio/mp3;base64," + voiceBase64)
          .play()
          .catch(() => {});
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

  /* ============================================================
     CAMERA / VISION
  ============================================================ */
  useEffect(() => {
    const setupStream = async () => {
      if (!cameraActive) {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks =
            videoRef.current.srcObject &&
            videoRef.current.srcObject.getTracks();
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
      const res = await fetch("/api/vision_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          memory: cipherMemory,
          userId: userId || "jim_default",
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply },
        ]);
      }

      const voiceBase64 = data.voice || data.audio;
      if (voiceBase64) {
        new Audio("data:audio/mp3;base64," + voiceBase64)
          .play()
          .catch(() => {});
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

  /* ============================================================
     CLEAR
  ============================================================ */
  const clearConversation = () => {
    if (confirm("Reset Cipher conversation?")) {
      setMessages([]);
      localStorage.removeItem("cipher_messages_v2");
    }
  };

  /* ============================================================
     SCREEN ROUTING
  ============================================================ */

  // Device panel as full screen for now
  if (screen === "device") {
    return (
      <DevicePanel
        theme={theme}
        onClose={() => setScreen("chat")}
      />
    );
  }

  // Omni screen
  if (screen === "omni") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.background,
          padding: 20,
          color: theme.textColor,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <button
          onClick={() => setScreen("chat")}
          style={{
            marginBottom: 20,
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: theme.userBubble,
            color: theme.textColor,
          }}
        >
          ← Back to Chat
        </button>

        <OmniSearchTest />
      </div>
    );
  }

  /* ============================================================
     DEFAULT — CHAT UI
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

        <div style={{ display: "flex", gap: 10 }}>
          {/* Menu */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.panelBg,
              color: theme.textColor,
              fontSize: 13,
              boxShadow: "0 0 18px rgba(148,163,184,0.4)",
            }}
          >
            ⚙ Menu
          </button>

          {/* Omni */}
          <button
            onClick={() => setScreen("omni")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.panelBg,
              color: theme.textColor,
              fontSize: 13,
              boxShadow: "0 0 18px rgba(148,163,184,0.4)",
            }}
          >
            🔍 Omni
          </button>

          {/* Device */}
          <button
            onClick={() => setScreen("device")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.panelBg,
              color: theme.textColor,
              fontSize: 13,
              boxShadow: "0 0 18px rgba(148,163,184,0.4)",
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
          boxShadow: `0 4px 30px ${theme.inputBorder}`,
          transition: "background 0.3s ease",
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background:
                m.role === "user" ? theme.userBubble : theme.cipherBubble,
              color: theme.textColor,
              margin: "8px 0",
              padding: "10px 14px",
              borderRadius: 14,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              transition: "background 0.3s ease",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ fontStyle: "italic", color: theme.textColor }}>
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
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
      <div
        style={{
          maxWidth: 700,
          margin: "16px auto 0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type to Cipher..."
          rows={2}
          style={{
            width: "100%",
            borderRadius: 10,
            padding: "10px 14px",
            border: `1px solid ${theme.inputBorder}`,
            background: theme.inputBg,
            color: theme.textColor,
            boxShadow: "0 0 16px rgba(15,23,42,0.8)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              flex: 1,
              background: theme.buttonBg,
              color: "white",
              padding: "10px 16px",
              borderRadius: 999,
              border: "none",
              fontWeight: 600,
              boxShadow: "0 0 20px rgba(59,130,246,0.6)",
            }}
          >
            Send
          </button>

          {/* MIC */}
          <button
            onClick={toggleRecording}
            disabled={loading}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              border: "none",
              background: isRecording ? "#b91c1c" : theme.cipherBubble,
              color: "#fff",
              fontSize: 20,
              boxShadow: isRecording
                ? "0 0 16px rgba(248,113,113,0.9)"
                : "0 0 10px rgba(148,163,184,0.5)",
            }}
          >
            {isRecording ? "■" : "🎤"}
          </button>

          {/* CAMERA */}
          <button
            onClick={openCamera}
            disabled={loading}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              border: "none",
              background: cameraActive ? "#b91c1c" : theme.userBubble,
              color: "#fff",
              fontSize: 22,
              boxShadow: "0 0 14px rgba(96,165,250,0.8)",
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
          onProfileChange={updateProfile}
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
          onPreviewTheme={previewTheme}
          onApplyTheme={applyTheme}
        />
      )}
    </div>
  );
}
