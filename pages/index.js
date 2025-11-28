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

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [theme, setTheme] = useState(themeStyles.cipher_core);

  /* ============================================================
     CLEAR CONVERSATION (MISSING IN YOUR FILE)
  ============================================================ */
  const clearConversation = () => {
    setMessages([]);
    try {
      localStorage.removeItem("cipher_messages_v2");
    } catch {}
  };

  /* ============================================================
     LOAD LOCAL MEMORY + CHAT
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

  /* ============================================================
     🔥 FIXED PROFILE LOADING
  ============================================================ */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let storedUserId = localStorage.getItem("cipher_userId");

        if (!storedUserId) {
          const createRes = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "newId" }),
          });
          const idData = await createRes.json();
          storedUserId = idData.userId;
          localStorage.setItem("cipher_userId", storedUserId);
        }

        const loadRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", userId: storedUserId }),
        });

        const data = await loadRes.json();
        setProfile(data.profile);
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  /* ============================================================
     UPDATE PROFILE
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
    const chosen = themeStyles[profile.currentTheme] || themeStyles.cipher_core;
    setTheme(chosen);
  }, [profile?.currentTheme]);

  /* ============================================================
     MEMORY EXTRACTION
  ============================================================ */
  const updateMemoryBlock = (fn) => {
    setCipherMemory((prev) => {
      const clone = structuredClone(prev);
      fn(clone);
      clone.meta.lastUpdated = new Date().toISOString();
      return clone;
    });
  };

  const extractFacts = (text) => {
    const lower = text.toLowerCase();

    updateMemoryBlock((mem) => {
      let m;

      m = lower.match(/\bmy name is ([a-z ]+)/i);
      if (m) mem.identity.userName = m[1].trim();

      m = lower.match(/hecate (lee )?is my daughter/i);
      if (m) mem.family.daughter.name = "Hecate Lee";

      m = lower.match(/hecate was born in (\d{4})/);
      if (m) mem.family.daughter.birthYear = parseInt(m[1]);

      m = lower.match(/favorite color is ([a-z ]+)/i);
      if (m) mem.preferences.favoriteColor = m[1].trim();
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
        body: JSON.stringify({
          message: text,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((p) => [...p, { role: "cipher", text: data.reply }]);
      }

      if (data.voice) {
        new Audio("data:audio/mp3;base64," + data.voice).play();
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
        transition: "0.3s ease",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto 10px auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>Cipher AI</h1>

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
      </div>

      {/* CHAT */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: theme.panelBg,
          padding: 20,
          borderRadius: 12,
          minHeight: "60vh",
          boxShadow: `0 4px 30px ${theme.inputBorder}`,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? theme.userBubble : theme.cipherBubble,
              padding: "10px 14px",
              margin: "8px 0",
              borderRadius: 14,
              color: theme.textColor,
              maxWidth: "80%",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ opacity: 0.6, fontStyle: "italic" }}>
            Cipher is thinking…
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          maxWidth: 700,
          margin: "10px auto",
          display: "flex",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type to Cipher..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            color: theme.textColor,
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            marginLeft: 8,
            background: theme.buttonBg,
            color: "#fff",
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
          background: theme.deleteBg,
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
        }}
      >
        Delete Conversation
      </button>

      {/* MENU */}
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
