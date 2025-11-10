// /pages/index.js
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  async function sendMessage() {
    if (!message.trim()) {
      setReply("Please enter a message.");
      return;
    }

    setReply("Cipher is thinking...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setReply(data.reply || "No reply received.");
    } catch (err) {
      console.error("Error sending message:", err);
      setReply("Error connecting to Cipher.");
    }

    setMessage("");
  }

  return (
    <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", padding: "40px" }}>
      <h1>Cipher AI 💬</h1>
      <p>Type normally to chat. Use <code>/reflect</code> before your message to trigger Cipher’s self-reflection.</p>
      <input
        id="messageInput"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        style={{
          padding: "10px",
          width: "300px",
          marginTop: "20px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
      <div>
        <button
          id="sendBtn"
          onClick={sendMessage}
          style={{
            background: "#5b2cf2",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            marginTop: "10px",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        >
          Send
        </button>
      </div>
      <p style={{ marginTop: "30px", fontSize: "18px" }}>
        <strong>Reply:</strong> {reply}
      </p>
    </div>
  );
}
