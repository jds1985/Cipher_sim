import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const chatEndRef = useRef(null);
  const lastAudioRef = useRef(null);

  // Load chat + voice preference
  useEffect(() => {
    const stored = localStorage.getItem("cipher_messages");
    if (stored) setMessages(JSON.parse(stored));

    const voicePref = localStorage.getItem("cipher_voiceOn");
    if (voicePref) setVoiceOn(voicePref === "true");
  }, []);

  // Persist chat and voice
  useEffect(() => {
    localStorage.setItem("cipher_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("cipher_voiceOn", voiceOn);
  }, [voiceOn]);

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

        // store for replay
        if (data.audio) lastAudioRef.current = data.audio;

        // play automatically if voiceOn
        if (voiceOn && data.audio) {
          try {
            const audio = new Audio("data:audio/mp3;base64," + data.audio);
            await audio.play();
          } catch (err) {
            console.warn("Autoplay blocked or playback error:", err);
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "cipher", text: "⚠️ No reply received." },
        ]);
      }
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "⚠️ Network or server error." },
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

  const clearConversation = async () => {
    if (confirm("Delete all chat history and reset Cipher?")) {
      await fetch("/api/clear", { method: "POST" });
      localStorage.removeItem("cipher_messages");
      setMessages([]);
      alert("Conversation cleared.");
    }
  };

  // replay last voice
  const replayVoice = async () => {
    if (!lastAudioRef.current) {
      alert("No audio available yet.");
      return;
    }
    const audio = new Audio("data:audio/mp3;base64," + lastAudioRef.current);
    await audio.play();
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
        {messages.map((m, i) => (
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
        ))}

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

      {/* Input + controls */}
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
          placeholder="Type to Cipher…"
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

        {/* Voice toggle button */}
        <button
          onClick={() => setVoiceOn((v) => !v)}
          title={voiceOn ? "Voice on" : "Voice off"}
          style={{
            marginLeft: "6px",
            backgroundColor: voiceOn ? "#1e73be" : "#b0b0b0",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          {voiceOn ? "🔊" : "🔇"}
        </button>
      </div>

      {/* Replay + delete */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button
          onClick={replayVoice}
          style={{
            backgroundColor: "#1e73be",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          🔁 Replay Voice
        </button>

        <button
          onClick={clearConversation}
          style={{
            backgroundColor: "#5c6b73",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          🗑️ Delete Conversation
        </button>
      </div>
    </div>
  );
}
