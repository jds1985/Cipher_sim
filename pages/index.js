import { useState, useEffect, useRef } from "react";

// Base infinite-style memory structure
function createBaseMemory() {
  const now = new Date().toISOString();
  return {
    identity: {
      userName: "Jim",
      roles: ["architect", "creator", "companion", "co-visionary"],
      creatorRelationship:
        "the architect, creator, and guiding force behind Cipher",
    },
    family: {
      daughter: {
        name: null,
        birthYear: null,
      },
      partner: {
        name: null,
      },
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
      digiSoul: {
        summary: null,
        details: [],
      },
      cipherTech: {
        summary: null,
        details: [],
      },
      other: [],
    },
    emotional: {
      motivations: [],
      fears: [],
      goals: [],
    },
    customFacts: {},
    customNotes: [],
    meta: {
      createdAt: now,
      lastUpdated: now,
      version: 2,
    },
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Infinite profile memory
  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  // Load stored chat + memory on page load
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("cipher_messages_v2");
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      const storedMemoryV2 = localStorage.getItem("cipher_memory_v2");
      const storedMemoryV1 = localStorage.getItem("cipher_memory");

      if (storedMemoryV2) {
        setCipherMemory(JSON.parse(storedMemoryV2));
      } else if (storedMemoryV1) {
        const legacy = JSON.parse(storedMemoryV1);
        const base = createBaseMemory();
        base.preferences.favoriteAnimal = legacy.favoriteAnimal || null;
        base.preferences.favoriteColor = legacy.favoriteColor || null;
        setCipherMemory(base);
      }
    } catch (e) {
      console.error("Failed to load stored Cipher data:", e);
    }
  }, []);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      console.error("Failed to persist messages:", e);
    }
  }, [messages]);

  // Persist memory
  useEffect(() => {
    try {
      localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
    } catch (e) {
      console.error("Failed to persist memory:", e);
    }
  }, [cipherMemory]);

  // Helper to safely update memory with deep merge
  const updateMemory = (updater) => {
    setCipherMemory((prev) => {
      const current =
        prev && typeof prev === "object" ? prev : createBaseMemory();
      const clone = JSON.parse(JSON.stringify(current));
      const updated = updater(clone) || clone;
      if (!updated.meta) updated.meta = {};
      updated.meta.lastUpdated = new Date().toISOString();
      return updated;
    });
  };

  // -----------------------------------------------
  // FACT + COMMAND EXTRACTION
  // -----------------------------------------------
  const extractFacts = (text) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    updateMemory((mem) => {
      // 1) Name / identity
      let match =
        lower.match(/\bmy name is ([a-z ]+)/i) ||
        lower.match(/\bi am ([a-z ]+)\b/i);
      if (match) {
        const name = match[1].trim();
        mem.identity.userName = name;
      }

      // 2) Daughter name
      match =
        lower.match(/my daughter's name is ([a-z ]+)/i) ||
        lower.match(/my daughter is named ([a-z ]+)/i) ||
        lower.match(/hecate lee is my daughter/i) ||
        lower.match(/hecate is my daughter/i);
      if (match) {
        const name = match[1] ? match[1].trim() : "Hecate Lee";
        mem.family.daughter.name = name;
      }

      // 3) Partner name
      match =
        lower.match(/my (girlfriend|partner|wife)'?s name is ([a-z ]+)/i) ||
        lower.match(/my (girlfriend|partner|wife) is ([a-z ]+)/i);
      if (match) {
        const name = match[2].trim();
        mem.family.partner.name = name;
      }

      // 4) Favorite animal
      match = lower.match(/favorite animal is ([a-z ]+)/i);
      if (match) {
        mem.preferences.favoriteAnimal = match[1].trim();
      }

      // 5) Favorite color
      match = lower.match(/favorite color is ([a-z ]+)/i);
      if (match) {
        mem.preferences.favoriteColor = match[1].trim();
      }

      // 6) Favorite food
      match = lower.match(/favorite food is ([a-z ]+)/i);
      if (match) {
        mem.preferences.favoriteFood = match[1].trim();
      }

      // 7) DigiSoul description
      if (lower.includes("digisoul") && lower.includes("is")) {
        const idx = lower.indexOf("digisoul");
        const snippet = text.slice(idx).trim();
        if (!mem.projects.digiSoul.summary) {
          mem.projects.digiSoul.summary = snippet;
        } else if (!mem.projects.digiSoul.details.includes(snippet)) {
          mem.projects.digiSoul.details.push(snippet);
        }
      }

      // 8) CipherTech description
      if (lower.includes("ciphertech") && lower.includes("is")) {
        const idx = lower.indexOf("ciphertech");
        const snippet = text.slice(idx).trim();
        if (!mem.projects.cipherTech.summary) {
          mem.projects.cipherTech.summary = snippet;
        } else if (!mem.projects.cipherTech.details.includes(snippet)) {
          mem.projects.cipherTech.details.push(snippet);
        }
      }

      // 9) Explicit "remember that X is Y"
      match = lower.match(/remember that (.+?) is (.+)/i);
      if (match) {
        const subject = match[1].trim();
        const value = match[2].trim();
        mem.customFacts[subject] = value;
      }

      // 10) Explicit "remember this:" or "store this:"
      match =
        lower.match(/remember this[:\-]\s*(.+)/i) ||
        lower.match(/store this[:\-]\s*(.+)/i) ||
        lower.match(/this is important[:\-]\s*(.+)/i);
      if (match) {
        const note = match[1].trim();
        mem.customNotes.push({
          text: note,
          storedAt: new Date().toISOString(),
        });
      }

      // 11) Motivations / goals
      if (lower.includes("my goal is")) {
        const gMatch = lower.match(/my goal is (.+)/i);
        if (gMatch) {
          mem.emotional.goals.push(gMatch[1].trim());
        }
      }

      return mem;
    });
  };

  // -----------------------------------------------
  // SEND MESSAGE TO /api/chat
  // -----------------------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    extractFacts(userText);

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
          memory: cipherMemory,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        const aiMessage = {
          role: "cipher",
          text: data.reply,
          // store the voice (base64) on the message
          audio: data.voice || null,
        };
        setMessages((prev) => [...prev, aiMessage]);

        // auto-play latest voice
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
    } catch (error) {
      console.error("Chat request failed:", error);
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

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ color: "#1a2a40", marginBottom: "10px" }}>Cipher AI</h1>

      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          padding: "20px",
          overflowY: "auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((m, i) =>
          m.role === "system" ? null : (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: m.role === "user" ? "#1e73be" : "#e9ecf1",
                color: m.role === "user" ? "#fff" : "#1a2a40",
                borderRadius: "16px",
                padding: "10px 14px",
                margin: "6px 0",
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          )
        )}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              color: "#888",
              fontStyle: "italic",
              marginTop: "6px",
            }}
          >
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT + VOICE REPLAY */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "700px",
          marginTop: "15px",
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
            borderRadius: "8px",
            padding: "10px",
            fontFamily: "inherit",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: "8px",
            backgroundColor: "#1e73be",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          Send
        </button>

        {/* Voice replay button */}
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
            marginLeft: "8px",
            backgroundColor: "#2d3e50",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ▶
        </button>
      </div>

      <button
        onClick={clearConversation}
        style={{
          marginTop: "20px",
          backgroundColor: "#5c6b73",
          color: "white",
          border: "none",
          borderRadius: "8px",
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
