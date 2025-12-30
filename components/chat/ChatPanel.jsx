import { useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "system", content: "> System online." },
    { role: "system", content: "> Awaiting input..." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    const nextMessages = [
      ...messages,
      { role: "user", content: `> ${text}` },
    ];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: nextMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "API error");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `> ${data.reply || "(no response)"}`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `> ERROR: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.log}>
        {messages.map((m, i) => (
          <div key={i} style={styles.line}>
            {m.content}
          </div>
        ))}
      </div>

      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={loading ? "Cipher thinking..." : "Type here"}
          style={styles.input}
          disabled={loading}
        />
        <button onClick={sendMessage} style={styles.button}>
          SEND
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "black",
    color: "#00ff00",
    fontFamily: "monospace",
    border: "2px solid #00ff00",
    padding: 12,
  },
  log: {
    flex: 1,
    overflowY: "auto",
    marginBottom: 12,
    whiteSpace: "pre-wrap",
  },
  line: {
    marginBottom: 6,
  },
  inputRow: {
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    background: "black",
    border: "1px solid #00ff00",
    color: "#00ff00",
    padding: 10,
    fontFamily: "monospace",
    outline: "none",
  },
  button: {
    background: "#00ff00",
    color: "black",
    border: "none",
    padding: "0 16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
