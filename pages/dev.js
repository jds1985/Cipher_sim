import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function send() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input,
        history: messages,
      }),
    });

    const data = await res.json();

    setMessages([
      ...messages,
      { role: "user", content: input },
      { role: "assistant", content: data.reply },
    ]);

    setInput("");
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Cipher OS</h1>

      <div style={{ minHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "80%" }}
      />
      <button onClick={send}>Send</button>
    </div>
  );
}
