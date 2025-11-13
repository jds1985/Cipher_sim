import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Hidden memory store (browser only)
  const [cipherMemory, setCipherMemory] = useState({});

  // Load messages + memory from localStorage
  useEffect(() => {
    const storedMessages = localStorage.getItem("cipher_messages");
    if (storedMessages) setMessages(JSON.parse(storedMessages));

    const storedMemory = localStorage.getItem("cipher_memory");
    if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
  }, []);

  // Save messages and auto-scroll
  useEffect(() => {
    localStorage.setItem("cipher_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save memory whenever it updates
  useEffect(() => {
    localStorage.setItem("cipher_memory", JSON.stringify(cipherMemory));
  }, [cipherMemory]);

  // Extract simple facts from user messages
  const extractFacts = (text) => {
    let newFacts = {};

    const patterns = [
      { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z]+)/i },
      { key: "favoriteColor", regex: /favorite color is ([a-zA-Z]+)/i },
      { key: "daughterName", regex: /my daughter'?s name is ([a-zA-Z ]+)/i },
      { key: "location", regex: /i live in ([a-zA-Z ]+)/i },
      { key: "age", regex: /i am ([0-9]+) years old/i },
      { key: "partnerName", regex: /my partner'?s name is ([a-zA-Z ]+)/i }
    ];

    for (const p of patterns) {
      const match = text.match(p.regex);
      if (match) newFacts[p.key] = match[1].trim();
    }

    if (Object.keys(newFacts).length > 0) {
      setCipherMemory((prev) => ({ ...prev, ...newFacts }));
    }
  };

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

        // If audio provided, play it
        if (data.audio) {
          const audio = new Audio("data:audio/mp3;base64," + data.audio);
          audio.play().catch(() => {});
        }
      } else {
        const err = { role: "cipher", text: "Error processing message." };
        setMessages((prev) => [...prev, err]);
      }
    } catch (error) {
      const fail = { role: "cipher", text: "Network or server error." };
      setMessages((prev) => [...prev, fail]);
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
