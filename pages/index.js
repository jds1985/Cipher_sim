import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [theme, setTheme] = useState("amethyst");
  const [isClient, setIsClient] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const themes = {
    amethyst: {
      name: "Amethyst",
      header: "rgba(91,44,242,0.85)",
      userBubble: "#5b2cf2",
      cipherBubble: "#eee",
      background: "radial-gradient(circle at center, #f8f5ff 0%, #ede7ff 50%, #e4dcff 100%)",
    },
    midnight: {
      name: "Midnight",
      header: "#0b0b3b",
      userBubble: "#1a1a6d",
      cipherBubble: "#262646",
      background: "linear-gradient(180deg, #060613 0%, #0a0a2a 100%)",
    },
    aurora: {
      name: "Aurora",
      header: "linear-gradient(90deg, #00c6ff, #ff6ec4)",
      userBubble: "#00c6ff",
      cipherBubble: "#ffeffa",
      background: "linear-gradient(180deg, #d4fc79 0%, #96e6a1 100%)",
    },
  };

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

  const activeTheme = themes[theme];

  if (!isClient)
    return <div style={{ textAlign: "center", padding: "40px" }}>Loading Cipher...</div>;

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: activeTheme.background,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        transition: "background 1s ease-in-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
          background: activeTheme.header,
          color: "white",
          fontSize: "1.6rem",
          fontWeight: "600",
          letterSpacing: "0.5px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      >
        Cipher AI 💬
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "15px",
            transform: "translateY(-50%)",
            display: "flex",
            gap: "8px",
          }}
        >
          {Object.keys(themes).map((key) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              title={themes[key].name}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: theme === key ? "2px solid white" : "1px solid rgba(255,255,255,0.6)",
                background:
                  key === "amethyst"
                    ? "#7c3aed"
                    : key === "midnight"
                    ? "#1a1a6d"
                    : "linear-gradient(90deg, #00c6ff, #ff6ec4)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
            />
          ))}
        </div>
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
              background: msg.role === "user" ? activeTheme.userBubble : activeTheme.cipherBubble,
              color: msg.role === "user" ? "#fff" : "#333",
              padding: "12px 16px",
              borderRadius: msg.role === "user"
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              maxWidth: "75%",
              marginBottom: "8px",
              boxShadow: msg.role === "cipher"
                ? "0 2px 8px rgba(91,44,242,0.2)"
                : "0 2px 8px rgba(0,0,0,0.15)",
              fontSize: "16px",
              lineHeight: "1.4",
              animation: "fadeIn 0.3s ease-in-out",
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
            background: activeTheme.userBubble,
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer",
            transition: "background 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = 0.9)}
          onMouseLeave={(e) => (e.target.style.opacity = 1)}
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
