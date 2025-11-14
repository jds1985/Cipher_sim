// /pages/index.js
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cipherMemory, setCipherMemory] = useState({});
  const chatEndRef = useRef(null);

  // Load stored chat + memory on page load
  useEffect(() => {
    const storedMessages = localStorage.getItem("cipher_messages");
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch {
        setMessages([]);
      }
    }

    const storedMemory = localStorage.getItem("cipher_memory");
    if (storedMemory) {
      try {
        setCipherMemory(JSON.parse(storedMemory));
      } catch {
        setCipherMemory({});
      }
    }
  }, []);

  // Persist messages and auto-scroll
  useEffect(() => {
    localStorage.setItem("cipher_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist memory
  useEffect(() => {
    localStorage.setItem("cipher_memory", JSON.stringify(cipherMemory));
  }, [cipherMemory]);

  // -----------------------------------------------
  // FACT EXTRACTION (short-term facts)
  // -----------------------------------------------
  const extractFacts = (text) => {
    const lower = text.toLowerCase();
    const updates = {};

    const checks = [
      {
        key: "favoriteAnimal",
        patterns: ["my favorite animal is", "favorite animal is"],
        regex: /favorite animal is ([a-zA-Z]+)/i,
      },
      {
        key: "favoriteColor",
        patterns: ["my favorite color is", "favorite color is"],
        regex: /favorite color is ([a-zA-Z]+)/i,
      },
      {
        key: "daughterName",
        patterns: ["my daughter's name is", "my daughter is named"],
        regex: /daughter(?:'s)? name is ([a-zA-Z ]+)/i,
      },
      {
        key: "partnerName",
        patterns: ["my partner's name is", "my partner is named"],
        regex: /partner(?:'s)? name is ([a-zA-Z ]+)/i,
      },
      {
        key: "location",
        patterns: ["i live in"],
        regex: /i live in ([a-zA-Z ]+)/i,
      },
      {
        key: "age",
        patterns: ["i am", "i'm"],
        regex: /i am ([0-9]+) years old/i,
      },
    ];

    for (const c of checks) {
      if (c.patterns.some((p) => lower.includes(p))) {
        const match = text.match(c.regex);
        if (match && match[1]) {
          updates[c.key] = match[1].trim();
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      setCipherMemory((prev) => ({ ...prev, ...updates }));
    }
  };

  // -----------------------------------------------
  // CONTEXT SNAPSHOT (Tier 2 memory)
  // -----------------------------------------------
  const buildContextSnapshot = () => {
    const recent = messages.slice(-8); // last 8 messages
    const lines = recent.map((m) => {
      const speaker = m.role === "user" ? "User" : "Cipher";
      return `${speaker}: ${m.text}`;
    });

    const factLines =
      cipherMemory && Object.keys(cipherMemory).length > 0
        ? Object.entries(cipherMemory).map(
            ([key, value]) =>
              `${key.replace(/([A-Z])/g, " $1").replace(/^./, (c) =>
                c.toUpperCase()
              )}: ${value}`
          )
        : [];

    const contextParts = [];

    if (lines.length > 0) {
      contextParts.push("Recent turns:", lines.join("\n"));
    }

    if (factLines.length > 0) {
      contextParts.push("Key short-term facts:", factLines.join("\n"));
    }

    return contextParts.join("\n\n") || "No recent context available.";
  };

  // -----------------------------------------------
  // SEND MESSAGE
  // -----------------------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    extractFacts(userText);

    const userMessage = { role: "user", text: userText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const contextSnapshot = buildContextSnapshot();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          memory: cipherMemory,
          context: contextSnapshot,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        const aiMessage = { role: "cipher", text: data.reply };
        setMessages((prev) => [...prev, aiMessage]);

        if (data.audio) {
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          audio.play().catch(() => {});
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: "Error processing message." },
        ]);
      }
    } catch (error) {
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
      localStorage.removeItem("cipher_messages");
      localStorage.removeItem("cipher_memory");
      setMessages([]);
      setCipherMemory({});
      alert("Conversation cleared.");
    }
  };

  // -----------------------------------------------
  // UI
  // -----------------------------------------------
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

      {/* Chat window */}
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

      {/* Input row */}
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
      </div>

      {/* Delete Conversation */}
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
