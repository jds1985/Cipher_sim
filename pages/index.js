// pages/index.js
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // -----------------------------------------------
  // MEMORY EXTRACTOR (same as your provided code)
  // -----------------------------------------------
  const extractFacts = (text) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    setMessages((prev) => [...prev]); // forces React sync if needed

    // Memory lives inside localStorage
    let mem = JSON.parse(localStorage.getItem("cipherMemory") || "{}");

    let get = (path, fallback) => {
      const parts = path.split(".");
      let val = mem;
      for (let p of parts) val = val?.[p];
      return val ?? fallback;
    };

    let set = (path, value) => {
      const parts = path.split(".");
      let obj = mem;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    };

    // 1) Name / identity
    let match =
      lower.match(/\bmy name is ([a-z ]+)/i) ||
      lower.match(/\bi am ([a-z ]+)\b/i);
    if (match) set("identity.userName", match[1].trim());

    // 2) Daughter name
    match =
      lower.match(/my daughter's name is ([a-z ]+)/i) ||
      lower.match(/my daughter is named ([a-z ]+)/i) ||
      lower.match(/hecate lee is my daughter/i) ||
      lower.match(/hecate is my daughter/i);
    if (match) {
      set("family.daughter.name", match[1] ? match[1].trim() : "Hecate Lee");
    }

    // 2b) Daughter birth year
    match =
      lower.match(/born in (\d{4})/) ||
      lower.match(/birth year is (\d{4})/) ||
      lower.match(/was born (\d{4})/) ||
      lower.match(/hecate was born in (\d{4})/);
    if (match) set("family.daughter.birthYear", parseInt(match[1]));

    // 3) Partner name
    match =
      lower.match(/my (girlfriend|partner|wife)'?s name is ([a-z ]+)/i) ||
      lower.match(/my (girlfriend|partner|wife) is ([a-z ]+)/i);
    if (match) set("family.partner.name", match[2].trim());

    // 4–6) Preferences
    match = lower.match(/favorite animal is ([a-z ]+)/i);
    if (match) set("preferences.favoriteAnimal", match[1].trim());

    match = lower.match(/favorite color is ([a-z ]+)/i);
    if (match) set("preferences.favoriteColor", match[1].trim());

    match = lower.match(/favorite food is ([a-z ]+)/i);
    if (match) set("preferences.favoriteFood", match[1].trim());

    // 7) DigiSoul description
    if (lower.includes("digisoul") && lower.includes("is")) {
      const idx = lower.indexOf("digisoul");
      const snippet = text.slice(idx).trim();
      if (!get("projects.digiSoul.summary"))
        set("projects.digiSoul.summary", snippet);
    }

    // 8) CipherTech description
    if (lower.includes("ciphertech") && lower.includes("is")) {
      const idx = lower.indexOf("ciphertech");
      const snippet = text.slice(idx).trim();
      if (!get("projects.cipherTech.summary"))
        set("projects.cipherTech.summary", snippet);
    }

    // 9) "Remember that X is Y"
    match = lower.match(/remember that (.+?) is (.+)/i);
    if (match) set(`customFacts.${match[1].trim()}`, match[2].trim());

    // 10) Explicit "remember this"
    match =
      lower.match(/remember this[:\-]\s*(.+)/i) ||
      lower.match(/store this[:\-]\s*(.+)/i) ||
      lower.match(/this is important[:\-]\s*(.+)/i);
    if (match) {
      if (!mem.customNotes) mem.customNotes = [];
      mem.customNotes.push({
        text: match[1].trim(),
        storedAt: new Date().toISOString(),
      });
    }

    // 11) Motivations
    if (lower.includes("my goal is")) {
      const gMatch = lower.match(/my goal is (.+)/i);
      if (gMatch) {
        if (!mem.emotional) mem.emotional = { goals: [] };
        mem.emotional.goals.push(gMatch[1].trim());
      }
    }

    localStorage.setItem("cipherMemory", JSON.stringify(mem));
  };

  // Auto scroll down
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to backend
  async function sendMessage() {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    // Extract memory BEFORE sending
    extractFacts(userText);

    const mem = JSON.parse(localStorage.getItem("cipherMemory") || "{}");

    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        memory: mem,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.reply) {
      setMessages((prev) => [...prev, { from: "cipher", text: data.reply }]);
    }

    if (data.voice) {
      const audio = new Audio("data:audio/mp3;base64," + data.voice);
      audio.play().catch(() => {});
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // -----------------------------------------------
  // UI — FULL WIDTH CHAT BUBBLES
  // -----------------------------------------------
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: 0,
        margin: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f7f9fc",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
          fontSize: 32,
          fontWeight: "bold",
          background: "white",
          borderBottom: "1px solid #ddd",
          width: "100%",
        }}
      >
        Cipher AI
      </div>

      {/* Chat Window */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 15,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              background: m.from === "user" ? "#1e88e5" : "#e0e0e0",
              color: m.from === "user" ? "white" : "black",
              padding: "12px 16px",
              borderRadius: 12,
              marginBottom: 10,
              maxWidth: "100%", // FULL WIDTH
              width: "auto",
              fontSize: 16,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ fontStyle: "italic", opacity: 0.6 }}>
            Cipher is thinking…
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 10,
          background: "white",
          borderTop: "1px solid #ddd",
          display: "flex",
          gap: 10,
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

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            background: "#1e88e5",
            color: "white",
            border: "none",
            padding: "0 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
