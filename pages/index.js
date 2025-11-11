// /pages/index.js  — Memory Orbs Mode ✨
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiToKj76nxjfXWhLiXgDS6VE8K86OFfiQ",
  authDomain: "digisoul1111.firebaseapp.com",
  projectId: "digisoul1111",
  storageBucket: "digisoul1111.appspot.com",
  messagingSenderId: "260537897412",
  appId: "1:260537897412:web:5c9cd6462747cde2c5491",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getFirestore(app); // still initializes Firestore for consistency

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("default");
  const chatEndRef = useRef(null);

  // 🔁 Smooth scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 Load messages (placeholder; still connects to API memory route)
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch("/api/memory");
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (err) {
        console.error("Memory fetch error:", err);
      }
    }
    loadMessages();
  }, [sessionId]);

  // ✉️ Send message
  async function sendMessage() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "user", text: message },
          { role: "cipher", text: data.reply },
        ]);
        setMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✨ Available sessions (each orb)
  const sessions = [
    { id: "default", color: "#9B59B6" },
    { id: "session_1", color: "#7D3CFF" },
    { id: "session_2", color: "#E67E22" },
    { id: "session_3", color: "#00CED1" },
  ];

  return (
    <main
      style={{
        fontFamily: "Inter, sans-serif",
        height: "100vh",
        background: "radial-gradient(ellipse at center, #0a0018 0%, #1a0033 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 🌌 Animated floating orbs */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          display: "flex",
          gap: "25px",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => setSessionId(s.id)}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: s.color,
              boxShadow:
                sessionId === s.id
                  ? `0 0 25px ${s.color}, 0 0 50px ${s.color}`
                  : `0 0 10px ${s.color}`,
              opacity: sessionId === s.id ? 1 : 0.6,
              cursor: "pointer",
              transform: sessionId === s.id ? "scale(1.1)" : "scale(1)",
              transition: "all 0.4s ease",
            }}
            title={`Enter ${s.id}`}
          />
        ))}
      </div>

      {/* Title */}
      <h1
        style={{
          marginTop: "170px",
          textShadow: "0 0 15px rgba(155,89,182,0.9)",
          fontWeight: "500",
        }}
      >
        Cipher AI 💬
      </h1>

      {/* Chat field */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "600px",
          overflowY: "auto",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "10px",
          padding: "15px",
          boxShadow: "0 0 10px rgba(255,255,255,0.1)",
          marginTop: "10px",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: "18px",
                background:
                  m.role === "user"
                    ? "rgba(90, 55, 230, 0.8)"
                    : "rgba(255, 255, 255, 0.15)",
                maxWidth: "80%",
                wordWrap: "break-word",
                transition: "all 0.3s ease",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input zone */}
      <div style={{ marginTop: "15px", width: "100%", maxWidth: "600px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type to Cipher..."
          style={{
            width: "75%",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            outline: "none",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            width: "20%",
            marginLeft: "5%",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: loading ? "#555" : "#7D3CFF",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      {/* Memory field link */}
      <p style={{ marginTop: "12px", fontSize: "14px" }}>
        <a
          href="/memory"
          style={{
            color: "#9B59B6",
            textDecoration: "none",
          }}
        >
          View Memory Field →
        </a>
      </p>
    </main>
  );
}
