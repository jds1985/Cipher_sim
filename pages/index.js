import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");

  const sendMessage = async () => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setReply(data.reply);
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Cipher AI</h1>
      <textarea
        rows="3"
        cols="50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <br />
      <button onClick={sendMessage}>Send</button>
      <p><strong>Reply:</strong> {reply}</p>
    </div>
  );
}
