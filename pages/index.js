import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 🔹 Auto-scroll to latest message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // 🔹 Load saved memory from Firestore (through API)
  useEffect(() => {
    const loadMemory = async () => {
      try {
        const res = await fetch("/api/memory");
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (err) {
        console.error("Failed to load memory:", err);
      }
    };
    loadMemory();
  }, []);

  // 🔹 Send message to Cipher
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage = {
      role: "user",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "cipher",
            text: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        console.error("No reply received:", data);
      }
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div
      style={{
        background: "radial-gradient(circle at top, #24124d, #0b031b)",
        color: "#fff",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700" }}>
          Cipher AI <span style={{ opacity: 0.8 }}>💬</span>
        </h1>
      </div>

      {/* Chat Window */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "600px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.role === "user" ? "#6a3df0" : "#3b2b5f",
              padding: "10px 15px",
              borderRadius: "20px",
              marginBottom: "10px",
              maxWidth: "80%",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          width: "100%",
          maxWidth: "600px",
          marginBottom: "10px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type to Cipher..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "25px",
            border: "none",
            outline: "none",
            fontSize: "1rem",
            backgroundColor: "#1b0e2b",
            color: "white",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            backgroundColor: "#6a3df0",
            color
