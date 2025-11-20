// pages/index.js
import { useState, useEffect, useRef } from "react";

// --------------------------------------
// BASE MEMORY OBJECT
// --------------------------------------
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

// --------------------------------------
// PURE FACT-EXTRACTION FUNCTION
// (returns UPDATED memory snapshot)
// --------------------------------------
function applyFactExtraction(currentMem, text) {
  const lower = text.toLowerCase().trim();
  if (!lower) return currentMem || createBaseMemory();

  const base =
    currentMem && typeof currentMem === "object"
      ? currentMem
      : createBaseMemory();

  // Deep clone so we don't mutate React state directly
  const mem = JSON.parse(JSON.stringify(base));
  let match;

  // --- Name / identity ---
  match =
    lower.match(/\bmy name is ([a-z ]+)/i) ||
    lower.match(/\bi am ([a-z ]+)\b/i);
  if (match) {
    mem.identity.userName = match[1].trim();
  }

  // --- Daughter name ---
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

  // --- Daughter birth year ---
  match =
    lower.match(/born in (\d{4})/) ||
    lower.match(/birth year is (\d{4})/) ||
    lower.match(/was born (\d{4})/) ||
    lower.match(/hecate was born in (\d{4})/);
  if (match) {
    mem.family.daughter.birthYear = parseInt(match[1], 10);
  }

  // --- Partner name ---
  match =
    lower.match(/my (girlfriend|partner|wife)'?s name is ([a-z ]+)/i) ||
    lower.match(/my (girlfriend|partner|wife) is ([a-z ]+)/i);
  if (match) {
    mem.family.partner.name = match[2].trim();
  }

  // --- Favorites ---
  match = lower.match(/favorite animal is ([a-z ]+)/i);
  if (match) mem.preferences.favoriteAnimal = match[1].trim();

  match = lower.match(/favorite color is ([a-z ]+)/i);
  if (match) mem.preferences.favoriteColor = match[1].trim();

  match = lower.match(/favorite food is ([a-z ]+)/i);
  if (match) mem.preferences.favoriteFood = match[1].trim();

  // --- DigiSoul description ---
  if (lower.includes("digisoul") && lower.includes("is")) {
    const idx = lower.indexOf("digisoul");
    const snippet = text.slice(idx).trim();
    if (!mem.projects.digiSoul.summary) {
      mem.projects.digiSoul.summary = snippet;
    } else if (!mem.projects.digiSoul.details.includes(snippet)) {
      mem.projects.digiSoul.details.push(snippet);
    }
  }

  // --- CipherTech description ---
  if (lower.includes("ciphertech") && lower.includes("is")) {
    const idx = lower.indexOf("ciphertech");
    const snippet = text.slice(idx).trim();
    if (!mem.projects.cipherTech.summary) {
      mem.projects.cipherTech.summary = snippet;
    } else if (!mem.projects.cipherTech.details.includes(snippet)) {
      mem.projects.cipherTech.details.push(snippet);
    }
  }

  // --- remember that X is Y ---
  match = lower.match(/remember that (.+?) is (.+)/i);
  if (match) {
    mem.customFacts[match[1].trim()] = match[2].trim();
  }

  // --- store this / remember this / this is important ---
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
  if (match) {
    mem.emotional.goals.push(match[1].trim());
  }

  mem.meta.lastUpdated = new Date().toISOString();
  return mem;
}

// --------------------------------------
// MAIN COMPONENT
// --------------------------------------
export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);
  const chatEndRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      const storedMemory = localStorage.getItem("cipher_memory_v2");
      if (storedMemory) {
        setCipherMemory(JSON.parse(storedMemory));
      }
    } catch (err) {
      console.error("Failed to load stored Cipher data:", err);
    }
  }, []);

  // Persist messages + auto-scroll
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Failed to persist messages:", err);
    }
  }, [messages]);

  // Persist memory
  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
    } catch (err) {
      console.error("Failed to persist memory:", err);
    }
  }, [cipherMemory]);

  // ------------------------------
  // SEND MESSAGE
  // ------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();

    // 1) Update memory synchronously and use that same snapshot for this call
    const updatedMemory = applyFactExtraction(cipherMemory, userText);
    setCipherMemory(updatedMemory);

    // 2) Add user message to UI
    const userMessage = { role: "user", text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          memory: updatedMemory, // Option B: always send full identity memory
        }),
      });

      const data = await res.json();

      if (data.reply) {
        const aiMessage = {
          role: "cipher",
          text: data.reply,
          audio: data.voice || null,
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (data.voice) {
          const audio = new Audio("data:audio/mp3;base64," + data.voice);
          audio.play().catch(() => {});
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: "Error processing message." },
        ]);
      }
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Network or server error." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    if (confirm("Delete all chat history and reset Cipher?")) {
      localStorage.removeItem("cipher_messages_v2");
      localStorage.removeItem("cipher_memory_v2");
      setMessages([]);
      setCipherMemory(createBaseMemory());
      alert("Conversation cleared.");
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 20,
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Header */}
      <h1
        style={{
          color: "#1a2a40",
          marginBottom: 10,
          marginTop: 10,
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        Cipher AI
      </h1>

      {/* Chat Container */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          backgroundColor: "white",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          padding: 20,
          overflowY: "auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: m.role === "user" ? "#1e73be" : "#e9ecf1",
              color: m.role === "user" ? "#fff" : "#1a2a40",
              borderRadius: 18,
              padding: "10px 14px",
              margin: "6px 0",
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              fontSize: 15,
              lineHeight: 1.4,
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              color: "#888",
              fontStyle: "italic",
              marginTop: 6,
            }}
          >
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input + Voice Replay */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 720,
          marginTop: 12,
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
            resize: "none",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 10,
            fontFamily: "inherit",
            fontSize: 15,
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: 8,
            backgroundColor: "#1e73be",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          Send
        </button>

        <button
          onClick={() => {
            const last = [...messages].reverse().find((m) => m.audio);
            if (last?.audio) {
              const audio = new Audio("data:audio/mp3;base64," + last.audio);
              audio.play().catch(() => {});
            } else {
              alert("No recent voice reply to replay yet.");
            }
          }}
          style={{
            marginLeft: 8,
            backgroundColor: "#2d3e50",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 48,
            height: 48,
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ▶
        </button>
      </div>

      {/* Clear Button */}
      <button
        onClick={clearConversation}
        style={{
          marginTop: 16,
          backgroundColor: "#5c6b73",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          cursor: "pointer",
          opacity: 0.9,
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
