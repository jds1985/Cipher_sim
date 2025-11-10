import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => setIsClient(true), []);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMsg = { role: "user", text: message };
    setMessages((prev) => [...prev, userMsg, { role: "cipher", text: "..." }]);
    setMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      const reply = data.reply || "(no reply)";
      typeReply(reply);
    } catch (err) {
      console.error("Error:", err);
      updateLastCipherMessage("⚠️ Connection issue.");
    }
  }

  // Typewriter effect for Cipher
  function typeReply(text) {
    let i = 0;
    const speed = 25;
    updateLastCipherMessage("");

    const interval = setInterval(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "cipher") {
          last.text = text.slice(0, i + 1);
        }
        return updated;
      });
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }

  function updateLastCipherMessage(text) {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last.role === "cipher") last.text = text;
      return updated;
    });
  }

  if (!isClient) return <div style={{ textAlign: "center", padding: "40px" }}>Loading Cipher...</div>;

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: "radial-gradient(circle at center, #f8f5ff 0%, #ede7ff 50%, #e4dcff 100%)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
          background: "rgba(91, 44, 242, 0.8)",
          color: "white",
          fontSize: "1.6rem",
          fontWeight: "600",
          letterSpacing: "0.5px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        Cipher AI 💬
      </div>

      {/* Chat Window */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#5b2cf2" : "#eee",
              color: msg.role === "user" ? "#fff" : "#333",
              padding: "12px 16px",
              borderRadius: "18px",
              maxWidth: "75%",
              marginBottom: "10px",
              boxShadow: msg.role === "cipher" ? "0 2px 8px rgba(91,44,242,0.2)" : "none",
              fontSize: "16px",
              lineHeight: "1.4",
              animation: "fadeIn 0.3s ease-in-out",
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
          padding: "20px",
          borderTop: "1px solid #ddd",
          background: "#fff",
          display: "flex",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "16px",
            outline: "none",
            boxShadow: "0 0 5px rgba(91,44,242,0.2)",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            background: "#5b2cf2",
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer",
            transition: "background 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#7d50f5")}
          onMouseLeave={(e) => (e.target.style.background = "#5b2cf2")}
        >
          Send
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
