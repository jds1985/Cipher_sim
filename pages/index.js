import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastAudio, setLastAudio] = useState(null);
  const chatEndRef = useRef(null);

  // Hidden memory
  const [cipherMemory, setCipherMemory] = useState({});

  // Load saved data
  useEffect(() => {
    const storedMessages = localStorage.getItem("cipher_messages");
    if (storedMessages) setMessages(JSON.parse(storedMessages));

    const storedMemory = localStorage.getItem("cipher_memory");
    if (storedMemory) setCipherMemory(JSON.parse(storedMemory));
  }, []);

  // Save messages + autoscroll
  useEffect(() => {
    localStorage.setItem("cipher_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save memory
  useEffect(() => {
    localStorage.setItem("cipher_memory", JSON.stringify(cipherMemory));
  }, [cipherMemory]);

  // Fact extraction
  const extractFacts = (text) => {
    const patterns = [
      { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z]+)/i },
      { key: "favoriteColor", regex: /favorite color is ([a-zA-Z]+)/i },
      { key: "daughterName", regex: /my daughter'?s name is ([a-zA-Z ]+)/i },
      { key: "location", regex: /i live in ([a-zA-Z ]+)/i },
      { key: "age", regex: /i am ([0-9]+) years old/i },
      { key: "partnerName", regex: /my partner'?s name is ([a-zA-Z ]+)/i },
    ];

    let newFacts = {};
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

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);
    setLastAudio(null);

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
        setMessages((prev) => [...prev, { role: "cipher", text: data.reply }]);

        // if audio exists, save + play
        if (data.audio) {
          setLastAudio(data.audio);
          try {
            const audio = new Audio("data:audio/mp3;base64," + data.audio);
            audio.play();
          } catch {}
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: "Error processing message." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Network or server error." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const replayAudio = () => {
    if (!lastAudio) return;
    const audio = new Audio("data:audio/mp3;base64," + lastAudio);
    audio.play();
  };

  const clearConversation = () => {
    if (confirm("Delete all chat history and reset Cipher?")) {
      localStorage.removeItem("cipher_messages");
      localStorage.removeItem("cipher_memory");
      setMessages([]);
      setCipherMemory({});
      setLastAudio(null);
      alert("Conversation cleared.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e8eef3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ color: "#1a2a40", marginBottom: "10px" }}>Cipher AI</h1>

      {/* Chat Window */}
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          padding: "20px",
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: m.role === "user" ? "#1e73be" : "#dfe4ea",
              color: m.role === "user" ? "white" : "#1a2a40",
              padding: "10px 14px",
              borderRadius: "16px",
              margin: "8px 0",
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div style={{ color: "#555", marginTop: "6px" }}>
            Cipher is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input + Send */}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type to Cipher..."
          rows={1}
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
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
          }}
        >
          Send
        </button>

        {/* Voice Replay Button */}
        <button
          onClick={replayAudio}
          disabled={!lastAudio}
          style={{
            marginLeft: "8px",
            backgroundColor: lastAudio ? "#2d89ef" : "#9bb7d1",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            fontSize: "20px",
          }}
        >
          🔊
        </button>
      </div>

      <button
        onClick={clearConversation}
        style={{
          marginTop: "20px",
          backgroundColor: "#444e57",
          color: "white",
          padding: "8px 16px",
          borderRadius: "8px",
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
