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

  // Profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // THEME
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

  /* ============================================================
     LOAD PROFILE FROM BACKEND
  ============================================================ */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data?.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  /* ============================================================
     UPDATE PROFILE
  ============================================================ */
  const updateProfile = async (updates) => {
    setProfile((prev) => ({ ...(prev || {}), ...updates }));

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Profile save error:", err);
    }
  };

  /* ============================================================
     ⭐ LIVE THEME ENGINE
  ============================================================ */
  useEffect(() => {
    if (!profile?.currentTheme) return;
    const chosen = themeStyles[profile.currentTheme] || themeStyles.cipher_core;
    setTheme(chosen);
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
     SEND TEXT MESSAGE
  ============================================================ */
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
        body: JSON.stringify({ message: text, memory: cipherMemory }),
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
    } catch {
      setMessages((p) => [...p, { role: "cipher", text: "Server error." }]);
    }

    setLoading(false);
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
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${theme.inputBorder}`,
            background: theme.panelBg,
            color: theme.textColor,
            fontSize: 13,
            transition: "0.3s ease",
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

      {/* INPUT BAR */}
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
            border: `1px solid ${theme.inputBorder}`,
            background: theme.inputBg,
            color: theme.textColor,
            transition: "0.3s ease",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: theme.buttonBg,
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            transition: "0.3s ease",
          }}
        >
          Send
        </button>
      </div>

      {/* DELETE */}
      <button
        onClick={clearConversation}
        style={{
          display: "block",
          margin: "20px auto",
          background: theme.deleteBg,
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          transition: "0.3s ease",
        }}
      >
        Delete Conversation
      </button>

      {/* MENU PANEL */}
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
