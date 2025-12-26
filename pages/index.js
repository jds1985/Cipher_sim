import { useState, useEffect, useRef } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "system", text: "System online." },
    { role: "system", text: "Awaiting input..." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Placeholder for existing Cipher response logic
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "cipher", text: "Cipher response placeholder." },
      ]);
    }, 1000);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>CIPHER CHAT</h1>

      <div style={styles.chatWindow}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(msg.role === "user"
                ? styles.userBubble
                : styles.cipherBubble),
            }}
          >
            <span style={styles.prompt}>
              {msg.role === "user" ? ">" : "§"}
            </span>{" "}
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div style={styles.typing}>
            § Cipher is typing<span className="blink">...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
        />
        <button style={styles.send} onClick={sendMessage}>
          SEND
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#000",
    color: "#00ff66",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "monospace",
  },
  title: {
    marginBottom: "10px",
    textShadow: "0 0 10px #00ff66",
  },
  chatWindow: {
    border: "1px solid #00ff66",
    padding: "15px",
    height: "65vh",
    overflowY: "auto",
    marginBottom: "15px",
    background: "#050505",
  },
  message: {
    marginBottom: "10px",
    maxWidth: "85%",
    lineHeight: "1.4",
  },
  userBubble: {
    alignSelf: "flex-end",
    color: "#00ff66",
  },
  cipherBubble: {
    color: "#66ffcc",
  },
  prompt: {
    opacity: 0.7,
  },
  typing: {
    fontStyle: "italic",
    opacity: 0.8,
  },
  inputRow: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    background: "#000",
    border: "1px solid #00ff66",
    color: "#00ff66",
    padding: "10px",
    fontFamily: "monospace",
  },
  send: {
    background: "#00ff66",
    border: "none",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
