import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastAudio, setLastAudio] = useState(null);
  const chatEndRef = useRef(null);

  // Load messages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cipher_messages");
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  // Auto-scroll + persist chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("cipher_messages", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();

      if (data.reply) {
        const aiMessage = { role: "cipher", text: data.reply };
        setMessages((prev) => [...prev, aiMessage]);

        if (data.audio) {
          try {
            const audio = new Audio("data:audio/mp3;base64," + data.audio);
            setLastAudio(audio);
            await audio.play();
          } catch (err) {
            console.warn("Audio playback blocked or failed:", err);
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: "Cipher could not process that request." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Network or server error." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const replayLastAudio = () => {
    if (lastAudio) {
      lastAudio.currentTime = 0;
      lastAudio.play();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = async () => {
    if (confirm("Clear all chat history?")) {
      await fetch("/api/clear", { method: "POST" });
      localStorage.removeItem("cipher_messages");
      setMessages([]);
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
        {messages.map((m, i) => {
          if (m.role === "system") return null;

          return (
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
          );
        })}

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

      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "700px",
          marginTop: "15px",
          alignItems: "center",
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

        <button
          onClick={replayLastAudio}
          disabled={!lastAudio}
          style={{
            marginLeft: "8px",
            backgroundColor: "#d9d9d9",
            border: "1px solid #999",
            borderRadius: "50%",
            padding: "10px",
            width: "45px",
            height: "45px",
            cursor: lastAudio ? "pointer" : "not-allowed",
          }}
        >
          ▷
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
        }}
      >
        Delete Conversation
      </button>
    </div>
  );
}
