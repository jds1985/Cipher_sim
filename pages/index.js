import { useState, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedReply, setDisplayedReply] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!reply) return;
    setDisplayedReply("");
    setIsTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedReply((prev) => prev + reply.charAt(i));
      i++;
      if (i >= reply.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25); // typing speed in ms

    return () => clearInterval(interval);
  }, [reply]);

  async function sendMessage() {
    if (!message.trim()) return;

    setReply("");
    setDisplayedReply("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setReply(data.reply || "(no reply)");
    } catch (err) {
      console.error("Error:", err);
      setReply("⚠️ Cipher encountered a connection issue.");
    }

    setMessage("");
  }

  if (!isClient) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Loading Cipher...</div>;
  }

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
        padding: "40px",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at center, #f8f5ff 0%, #ede7ff 50%, #e4dcff 100%)",
        transition: "background 1s ease-in-out",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          color: "#3a1b9a",
          marginBottom: "10px",
        }}
      >
        Cipher AI 💬
      </h1>
      <p style={{ fontSize: "16px", color: "#444" }}>
        Type normally to chat. Use <code>/reflect</code> before your message to trigger Cipher’s
        self-reflection.
      </p>

      <div style={{ marginTop: "25px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            padding: "10px",
            width: "300px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            outline: "none",
            boxShadow: "0 0 6px rgba(91, 44, 242, 0.2)",
          }}
        />
        <div>
          <button
            onClick={sendMessage}
            style={{
              background: "#5b2cf2",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              marginTop: "10px",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#7d50f5")}
            onMouseLeave={(e) => (e.target.style.background = "#5b2cf2")}
          >
            Send
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "40px",
          fontSize: "18px",
          color: "#2a1b64",
          minHeight: "60px",
          transition: "opacity 0.5s ease-in-out",
          opacity: displayedReply ? 1 : 0,
        }}
      >
        <strong>Reply:</strong>{" "}
        <span
          style={{
            display: "inline-block",
            transition: "opacity 1s ease-in-out",
            opacity: isTyping ? 0.9 : 1,
          }}
        >
          {displayedReply}
        </span>
        {isTyping && <span className="cursor">▋</span>}
      </div>

      <style jsx>{`
        .cursor {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          50.1%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
