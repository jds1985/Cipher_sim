// pages/index.js
import { useState, useEffect, useRef } from "react";
import ProfilePanel from "../components/ProfilePanel";

// ------------------------------
// THEME ENGINE  (NEW)
// ------------------------------
const themeStyles = {
  cipher_core: {
    background: "#050816",
    panelBg: "#111827",
    userBubble: "#1d4ed8",
    cipherBubble: "#1f2937",
  },
  nebula_purple: {
    background: "radial-gradient(circle at 20% 20%, #3a0ca3, #240046 80%)",
    panelBg: "rgba(30,0,60,0.7)",
    userBubble: "rgba(150,80,255,0.4)",
    cipherBubble: "rgba(60,20,110,0.6)",
  },
  midnight_glass: {
    background: "linear-gradient(160deg, #0a0f14 0%, #111a22 100%)",
    panelBg: "rgba(14,24,34,0.8)",
    userBubble: "rgba(50,130,180,0.4)",
    cipherBubble: "rgba(20,35,50,0.6)",
  },
  sunset_amber: {
    background: "linear-gradient(160deg, #3a1c00 0%, #120800 100%)",
    panelBg: "rgba(40,15,0,0.7)",
    userBubble: "rgba(255,130,40,0.4)",
    cipherBubble: "rgba(150,70,20,0.6)",
  },
};

// ------------------------------
// BASE MEMORY OBJECT
// ------------------------------
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

// ------------------------------
// MAIN COMPONENT
// ------------------------------
export default function Home() {
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

  // Profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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
  // LOAD PROFILE FROM BACKEND
  // ------------------------------
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

  // ------------------------------
  // UPDATE PROFILE
  // ------------------------------
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

  // ------------------------------
  // ⭐ LIVE THEME ENGINE
  // ------------------------------
  const [theme, setTheme] = useState(themeStyles.cipher_core);

  useEffect(() => {
    if (!profile?.currentTheme) return;
    const chosen = themeStyles[profile.currentTheme] || themeStyles.cipher_core;
    setTheme(chosen);
  }, [profile?.currentTheme]);

  // ------------------------------
  // MEMORY UPDATE + FACT EXTRACTION
  // ------------------------------
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
        body: JSON.stringify({ message: text, memory: cipherMemory }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((p) => [...p, { role: "cipher", text: data.reply }]);
      }

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice).play().catch(() => {});
      }
    } catch {
      setMessages((p) => [...p, { role: "cipher", text: "Server error." }]);
    }

    setLoading(false);
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,   // ⭐ THEME APPLIED
        padding: 20,
        fontFamily: "Inter, sans-serif",
        color: "#e5e7eb",
        transition: "background 0.4s ease",
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
            border: "1px solid rgba(148,163,184,0.7)",
            background: "rgba(30,41,59,0.8)",
            color: "#e5e7eb",
            fontSize: 13,
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
          background: theme.panelBg,   // ⭐ THEME APPLIED
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
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
                m.role === "user"
                  ? theme.userBubble         // ⭐ THEME APPLIED
                  : theme.cipherBubble,      // ⭐
              color: "#e5e7eb",
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
          <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
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
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: "#1d4ed8",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
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
          background: "#4b5563",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
        }}
      >
        Delete Conversation
      </button>

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
