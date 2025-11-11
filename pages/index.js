// /pages/index.js
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiToKj76nxjfXWhLiXgDS6VE8K86OFfiQ",
  authDomain: "digisoul1111.firebaseapp.com",
  projectId: "digisoul1111",
  storageBucket: "digisoul1111.appspot.com",
  messagingSenderId: "260537897412",
  appId: "1:260537897412:web:5c9cd6462747cde2c5491",
};

// Initialize Firebase (client-side)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("default");
  const chatEndRef = useRef(null);

  // Load session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cipher.sessionId");
    if (saved) setSessionId(saved);
  }, []);

  // Save session
  useEffect(() => {
    localStorage.setItem("cipher.sessionId", sessionId);
  }, [sessionId]);

  // Auto-scroll on message change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load memory from API
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch("/api/memory");
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Memory fetch error:", err);
      }
    }
    loadMessages();
  }, []);

  // Send message
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
          { role: "user", text: message, sessionId },
          { role: "cipher", text: data.reply, sessionId },
        ]);
        setMessage("");
      } else {
        console.error("No reply received");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: "Inter, sans-serif",
        height: "100vh",
        background: "linear-gradient(180deg, #0a0018 0%, #1a0033 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "10px" }}>Cipher AI 💬</h1>

      {/* Session select */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "8px" }}>Session:</label>
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value.trim() || "default")}
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            padding: "6px 10px",
          }}
        />
      </div>

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
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

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
    </main>
  );
}
