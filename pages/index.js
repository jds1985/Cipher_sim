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

// Small helper to read a File -> base64 (no prefix, just data)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is data:<mime>;base64,XXXX  — strip the header
      const result = reader.result;
      const base64 = String(result).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

  // NEW: refs for mic + (future) camera
  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // ------------------------------
  // LOAD FROM LOCAL STORAGE
  // ------------------------------
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) setMessages(JSON.parse(storedMessages));

      const storedMemory = localStorage.getItem("cipher_memory_v2");
      if (storedMemory) {
        setCipherMemory(JSON.parse(storedMemory));
      }
    } catch (err) {
      console.error("Load memory error:", err);
    }
  }, []);

  // ------------------------------
  // SAVE TO LOCAL STORAGE
  // ------------------------------
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
    } catch (err) {}
  }, [cipherMemory]);

  // ------------------------------
  // UPDATE MEMORY HELPER
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
  // FACT + COMMAND EXTRACTION
  // ------------------------------
  const extractFacts = (text) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    updateMemory((mem) => {
      let match;

      // --- Name ---
      match =
        lower.match(/\bmy name is ([a-z ]+)/i) ||
        lower.match(/\bi am ([a-z ]+)\b/i);
      if (match) mem.identity.userName = match[1].trim();

      // --- Daughter ---
      match =
        lower.match(/my daughter's name is ([a-z ]+)/i) ||
        lower.match(/my daughter is named ([a-z ]+)/i) ||
        lower.match(/hecate lee is my daughter/i) ||
        lower.match(/hecate is my daughter/i);
      if (match) {
        mem.family.daughter.name = match[1]
          ? match[1].trim()
          : "Hecate Lee";
      }

      // Daughter birth year
      match =
        lower.match(/born in (\d{4})/) ||
        lower.match(/birth year is (\d{4})/) ||
        lower.match(/was born (\d{4})/) ||
        lower.match(/hecate was born in (\d{4})/);
      if (match) mem.family.daughter.birthYear = parseInt(match[1]);

      // --- Partner ---
      match =
        lower.match(/my (girlfriend|partner|wife)'?s name is ([a-z ]+)/i) ||
        lower.match(/my (girlfriend|partner|wife) is ([a-z ]+)/i);
      if (match) mem.family.partner.name = match[2].trim();

      // --- Favorites ---
      match = lower.match(/favorite animal is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteAnimal = match[1].trim();

      match = lower.match(/favorite color is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteColor = match[1].trim();

      match = lower.match(/favorite food is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteFood = match[1].trim();

      // --- DigiSoul project text (future use, harmless here) ---
      if (lower.includes("digisoul") && lower.includes("is")) {
        const idx = lower.indexOf("digisoul");
        const snippet = text.slice(idx).trim();
        if (!mem.projects.digiSoul.summary)
          mem.projects.digiSoul.summary = snippet;
        else if (!mem.projects.digiSoul.details.includes(snippet))
          mem.projects.digiSoul.details.push(snippet);
      }

      // --- CipherTech ---
      if (lower.includes("ciphertech") && lower.includes("is")) {
        const idx = lower.indexOf("ciphertech");
        const snippet = text.slice(idx).trim();
        if (!mem.projects.cipherTech.summary)
          mem.projects.cipherTech.summary = snippet;
        else if (!mem.projects.cipherTech.details.includes(snippet))
          mem.projects.cipherTech.details.push(snippet);
      }

      // --- remember that X is Y ---
      match = lower.match(/remember that (.+?) is (.+)/i);
      if (match) mem.customFacts[match[1].trim()] = match[2].trim();

      // --- store this / remember this ---
      match =
        lower.match(/remember this[:\-]\s*(.+)/i) ||
        lower.match(/store this[:\-]\s*(.+)/i) ||
        lower.match(/this is important[:\-]\s*(.+)/i);
      if (match) {
        mem.customNotes.push({
          text: match[1].trim(),
          storedAt: new Date().toISOString(),
        });
      }

      // --- goals ---
      match = lower.match(/my goal is (.+)/i);
      if (match) mem.emotional.goals.push(match[1].trim());
    });
  };

  // ------------------------------
  // TEXT MESSAGE FLOW
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

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
          { role: "cipher", text: data.reply, audio: data.voice || null },
        ]);

        if (data.voice) {
          const audio = new Audio("data:audio/mp3;base64," + data.voice);
          audio.play().catch(() => {});
        }
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ------------------------------
  // VOICE MESSAGE FLOW (MIC)
//  Uses hidden <input type="file" accept="audio/*" capture="microphone">
// ------------------------------
  const handleAudioSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // reset so same file can be chosen again
    if (!file || loading) return;

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);

      // Tell UI we got a voice message (text will be replaced when transcript arrives)
      setMessages((prev) => [
        ...prev,
        { role: "user", text: "🎤 Voice message..." },
      ]);

      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      // Expect: { transcript, reply, voice }
      if (data.transcript) {
        extractFacts(data.transcript);

        setMessages((prev) => {
          const withoutPlaceholder = [...prev];
          // Replace last "voice message..." bubble with transcript text
          const idx = withoutPlaceholder.findIndex(
            (m, i) =>
              i === withoutPlaceholder.length - 1 && m.text.startsWith("🎤")
          );
          if (idx !== -1) {
            withoutPlaceholder[idx] = {
              ...withoutPlaceholder[idx],
              text: "🎤 " + data.transcript,
            };
          }
          return withoutPlaceholder;
        });
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply, audio: data.voice || null },
        ]);

        if (data.voice) {
          const audio = new Audio("data:audio/mp3;base64," + data.voice);
          audio.play().catch(() => {});
        }
      }
    } catch (err) {
      console.error("Voice error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Voice processing error." },
      ]);
    }
    setLoading(false);
  };

  // ------------------------------
  // CLEAR CONVERSATION
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
  // UI RENDER
  // ------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
        padding: 20,
        fontFamily: "Inter, system-ui, sans-serif",
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
          onKeyPress={handleKeyPress}
          placeholder="Type to Cipher..."
          rows={1}
          style={{
            flex: 1,
            borderRadius: 8,
            padding: 10,
            border: "1px solid #ccc",
          }}
        />

        {/* Send text */}
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

        {/* Mic button – opens phone recorder */}
        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          disabled={loading}
          style={{
            marginLeft: 8,
            background: "#2d3e50",
            color: "white",
            width: 48,
            height: 48,
            borderRadius: "50%",
            fontSize: 20,
            border: "none",
          }}
        >
          🎤
        </button>
      </div>

      {/* Hidden audio input for microphone capture */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        capture="microphone"
        style={{ display: "none" }}
        onChange={handleAudioSelected}
      />

      {/* Hidden image input (camera) – wired later */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={() => {
          // camera pipeline will go here in the next step
        }}
      />

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
