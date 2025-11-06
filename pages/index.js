import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setReply("");

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
      setReply("Error: could not connect to Cipher.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: "2rem", textAlign: "center" }}>
      <h1>Cipher AI 💬</h1>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask Cipher something..."
        style={{
          padding: "0.5rem",
          width: "80%",
          maxWidth: "400px",
          marginBottom: "1rem",
        }}
      />
      <br />
      <button
        onClick={sendMessage}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          background: loading ? "#888" : "#4B0082",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {loading ? "Thinking..." : "Send"}
      </button>
      <div style={{ marginTop: "2rem", minHeight: "50px" }}>
        <strong>Reply:</strong> {reply}
      </div>
    </main>
  );
}
