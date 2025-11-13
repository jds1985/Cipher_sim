import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Cipher memory store (browser only)
  const [cipherMemory, setCipherMemory] = useState({});

  // Load stored chat + memory on page load
  useEffect(() => {
    const storedMessages = localStorage.getItem("cipher_messages");
    if (storedMessages) setMessages(JSON.parse(storedMessages));

    const storedMemory = localStorage.getItem("cipher_memory");
    if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
  }, []);

  // Persist messages
  useEffect(() => {
    localStorage.setItem("cipher_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist memory
  useEffect(() => {
    localStorage.setItem("cipher_memory", JSON.stringify(cipherMemory));
  }, [cipherMemory]);

  // -----------------------------------------------
  // IMPROVED FACT EXTRACTION ENGINE
  // More flexible detection + better matching
  // -----------------------------------------------

  const extractFacts = (text) => {
    const lower = text.toLowerCase();
    let updates = {};

    const checks = [
      {
        key: "favoriteAnimal",
        patterns: [
          "my favorite animal is",
          "favorite animal is",
          "i like",
          "i love"
        ],
        extract: () => {
          const match = lower.match(/favorite animal is ([a-zA-Z]+)/i);
          return match ? match[1] : null;
        }
      },
      {
        key: "favoriteColor",
        patterns: ["my favorite color is", "favorite color is"],
        extract: () => {
          const match = lower.match(/favorite color is ([a-zA-Z]+)/i);
          return match ? match[1] : null;
        }
      },
      {
        key: "daughterName",
        patterns: ["my daughter's name is", "my daughter is named"],
        extract: () => {
          const match = lower.match(/daughter(?:'s)? name is ([a-zA-Z ]+)/i);
          return match ? match[1].trim() : null;
        }
      },
      {
        key: "partnerName",
        patterns: ["my partner's name is", "my partner is"],
        extract: () => {
          const match = lower.match(/partner(?:'s)? name is ([a-zA-Z ]+)/i);
          return match ? match[1].trim() : null;
        }
      },
      {
        key: "location",
        patterns: ["i live in"],
        extract: () => {
          const match = lower.match(/i live in ([a-zA-Z ]+)/i);
          return match ? match[1].trim() : null;
        }
      }
    ];

    for (const c of checks) {
      if (c.patterns.some((p) => lower.includes(p))) {
        const value = c.extract();
        if (value) updates[c.key] = value;
      }
    }

    if (Object.keys(updates).length > 0) {
      setCipherMemory((prev) => ({ ...prev, ...updates }));
    }
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
          memory: cipherMemory
        })
      });

      const data = await res.json();

      if (data.reply) {
        const aiMessage = { role: "cipher", text: data.reply };
        setMessages((prev) => [...prev, aiMessage]);

        // If voice response exists, play it
        if (data.audio) {
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          audio.play().catch(() => {});
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: "Error processing message." }
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Network or server error." }
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
        fontFamily: "Inter, sans-serif"
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
          flexDirection: "column"
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
                whiteSpace: "pre-wrap"
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
              marginTop: "6px"
            }}
          >
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "700px",
          marginTop: "15px"
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
            fontFamily: "inherit"
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
            cursor: "pointer"
          }}
        >
          Send
        </button>

        {/* Voice replay button */}
        <button
          onClick={() => {
            const last = messages.filter((m) => m.role === "cipher").pop();
            if (last?.audio) {
              const audio = new Audio("data:audio/mp3;base64," + last.audio);
              audio.play().catch(() => {});
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
            cursor: "pointer"
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
          opacity: 0.9
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
