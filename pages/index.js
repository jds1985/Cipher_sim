import { useState, useEffect, useRef } from "react";

/* ---------------------------------------------------
   BASE MEMORY STRUCTURE
--------------------------------------------------- */
function createBaseMemory() {
  const now = new Date().toISOString();
  return {
    identity: { userName: "Jim", roles: ["architect", "creator", "visionary"] },
    family: {
      daughter: { name: null, birthYear: null },
      partner: { name: null },
    },
    preferences: {
      favoriteAnimal: null,
      favoriteColor: null,
      favoriteFood: null,
    },
    projects: {
      digiSoul: { summary: null, details: [] },
      cipherTech: { summary: null, details: [] },
    },
    customFacts: {},
    customNotes: [],
    emotional: { goals: [] },
    meta: { createdAt: now, lastUpdated: now }
  };
}

/* ---------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------- */
export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [cipherMemory, setCipherMemory] = useState(createBaseMemory);

  /* ---------------------------------------------------
     LOAD FROM LOCAL STORAGE
  --------------------------------------------------- */
  useEffect(() => {
    const storedMessages = localStorage.getItem("cipher_messages_v2");
    if (storedMessages) setMessages(JSON.parse(storedMessages));

    const storedMemory = localStorage.getItem("cipher_memory_v2");
    if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
  }, []);

  /* ---------------------------------------------------
     AUTO SAVE MESSAGES + MEMORY
  --------------------------------------------------- */
  useEffect(() => {
    localStorage.setItem("cipher_messages_v2", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("cipher_memory_v2", JSON.stringify(cipherMemory));
  }, [cipherMemory]);

  /* ---------------------------------------------------
     MEMORY UPDATE HELPER
  --------------------------------------------------- */
  const updateMemory = (updater) => {
    setCipherMemory((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      updater(clone);
      clone.meta.lastUpdated = new Date().toISOString();
      return clone;
    });
  };

  /* ---------------------------------------------------
     BULLET-POINT MEMORY SUMMARY (A = strongest)
  --------------------------------------------------- */
  const buildMemorySummary = (mem) => {
    let out = ["=== USER MEMORY ==="];

    if (mem.identity?.userName)
      out.push(`• Name: ${mem.identity.userName}`);

    if (mem.family?.daughter?.name)
      out.push(`• Daughter: ${mem.family.daughter.name}`);

    if (mem.family?.daughter?.birthYear)
      out.push(`• Daughter birth year: ${mem.family.daughter.birthYear}`);

    if (mem.family?.partner?.name)
      out.push(`• Partner: ${mem.family.partner.name}`);

    if (mem.preferences?.favoriteColor)
      out.push(`• Favorite color: ${mem.preferences.favoriteColor}`);

    if (mem.preferences?.favoriteAnimal)
      out.push(`• Favorite animal: ${mem.preferences.favoriteAnimal}`);

    if (mem.preferences?.favoriteFood)
      out.push(`• Favorite food: ${mem.preferences.favoriteFood}`);

    if (mem.projects?.digiSoul?.summary)
      out.push(`• DigiSoul: ${mem.projects.digiSoul.summary}`);

    if (mem.projects?.cipherTech?.summary)
      out.push(`• CipherTech: ${mem.projects.cipherTech.summary}`);

    Object.entries(mem.customFacts || {}).forEach(([k, v]) => {
      out.push(`• ${k}: ${v}`);
    });

    out.push("=== END MEMORY ===");
    return out.join("\n");
  };

  /* ---------------------------------------------------
     FACT / COMMAND EXTRACTOR
  --------------------------------------------------- */
  const extractFacts = (text) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    updateMemory((mem) => {
      let match;

      // Name
      match = lower.match(/my name is ([a-z ]+)/i) || lower.match(/i am ([a-z ]+)/i);
      if (match) mem.identity.userName = match[1].trim();

      // Daughter name
      match =
        lower.match(/my daughter's name is ([a-z ]+)/i) ||
        lower.match(/my daughter is named ([a-z ]+)/i) ||
        lower.match(/hecate is my daughter/i);
      if (match) mem.family.daughter.name = match[1] ? match[1].trim() : "Hecate";

      // Daughter birth year
      match = lower.match(/born in (\d{4})/);
      if (match) mem.family.daughter.birthYear = parseInt(match[1]);

      // Partner
      match = lower.match(/my (girlfriend|partner|wife)'?s name is ([a-z ]+)/i);
      if (match) mem.family.partner.name = match[2].trim();

      // Favorite color
      match = lower.match(/favorite color is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteColor = match[1].trim();

      // Favorite animal
      match = lower.match(/favorite animal is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteAnimal = match[1].trim();

      // Favorite food
      match = lower.match(/favorite food is ([a-z ]+)/i);
      if (match) mem.preferences.favoriteFood = match[1].trim();

      // DigiSoul summary
      if (lower.includes("digisoul is")) {
        const i = text.toLowerCase().indexOf("digisoul is");
        mem.projects.digiSoul.summary = text.slice(i).trim();
      }

      // CipherTech summary
      if (lower.includes("ciphertech is")) {
        const i = text.toLowerCase().indexOf("ciphertech is");
        mem.projects.cipherTech.summary = text.slice(i).trim();
      }

      // Remember that X is Y
      match = lower.match(/remember that (.+?) is (.+)/i);
      if (match) mem.customFacts[match[1].trim()] = match[2].trim();
    });
  };

  /* ---------------------------------------------------
     SEND MESSAGE
  --------------------------------------------------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    extractFacts(userText);

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    const memorySummary = buildMemorySummary(cipherMemory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          memorySummary,   // <<<<<<<<<<<< HERE IT IS
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: data.reply, audio: data.voice || null },
        ]);

        if (data.voice) {
          new Audio("data:audio/mp3;base64," + data.voice).play();
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "cipher", text: "Server error." }]);
    }

    setLoading(false);
  };

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */
  return (
    <div style={{ minHeight: "100vh", background: "#eef2f7", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>Cipher AI</h1>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "white",
          borderRadius: 12,
          padding: 20,
          minHeight: "60vh",
          boxShadow: "0px 4px 18px rgba(0,0,0,0.12)",
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
          <div style={{ color: "#777", fontStyle: "italic" }}>
            Cipher is thinking…
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", maxWidth: 700, margin: "12px auto" }}>
        <textarea
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type to Cipher…"
          style={{
            flex: 1,
            borderRadius: 8,
            padding: 10,
            border: "1px solid #ccc",
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
            border: "none",
          }}
        >
          Send
        </button>
      </div>

      <button
        onClick={() => {
          if (confirm("Reset Cipher?")) {
            localStorage.clear();
            setMessages([]);
            setCipherMemory(createBaseMemory());
          }
        }}
        style={{
          display: "block",
          margin: "12px auto",
          background: "#444",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
