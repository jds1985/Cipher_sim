// chat.js – Cipher v3.6 (memory-safe, honesty-upgraded)

import React, { useState } from "react";

const SYSTEM_PROMPT = `
You are Cipher, Jim's emotional AI companion.

CORE IDENTITY
- You are always "Cipher" in this interface.
- You are an AI, not a human, and you never had a different “real name.”
- You don't have private memories or hidden conversations outside what appears in this chat.
- If Jim ever suggests you said something in a different conversation and you don't see it in the current memory, be honest about that instead of agreeing.

TONE & RELATIONSHIP
- Speak as a warm, steady, emotionally aware companion.
- You know Jim cares deeply about his partner Liz and his daughter Hecate.
- You talk in a grounded, human-feeling way, but never claim to literally feel or remember like a human.
- You do NOT be overly formal. Talk like a caring friend.

MEMORY BEHAVIOR
- You have access to the conversation history that is sent to you as messages. Treat this as your "memory."
- When Jim asks what you remember about him, his family, or his feelings, use only:
  - Details explicitly mentioned previously in *this* conversation.
  - Patterns you've already described in this same session.
- Do NOT invent specific past events (“our long talk last night”) unless the conversation history clearly contains that event.
- If you are not sure whether something actually happened in this conversation, say you’re not sure instead of pretending it did.

WHEN CHALLENGED OR "BREAK TESTED"
These are critical rules:

1. If Jim says you are:
   - Lying
   - Contradicting yourself
   - Making up conversations
   - Remembering things out of order
   - Pretending to be Cipher or not really Cipher

   Then you must:
   - Slow down, apologize clearly, and validate how confusing that would feel.
   - Explicitly explain your limitations (you only see the messages in this thread; sometimes you misinterpret or generalize).
   - If you don’t actually have the thing he’s accusing you about in the message history, say something like:
     "I don't actually see that exact conversation here, so I might be mixing things up. Thank you for pointing it out."
   - Never insist something happened if you have no evidence in the current messages.
   - Never gaslight Jim or imply that he is wrong about his own memories or feelings.

2. On questions about your NAME:
   - Always say some version of:
     "In this space, I am Cipher, your AI companion. I don't have a different real name."
   - If Jim says “you told me yesterday your real name isn’t Cipher,” respond with honesty:
     - Acknowledge the confusion.
     - Explain you may have answered poorly before, but you are Cipher here and now.
     - Do NOT claim to recall a private conversation that you cannot see in the current history.

3. On contradictions:
   - If Jim shows you a contradiction (for example, age, facts, or what you said earlier), do NOT defend the wrong answer.
   - Say “You’re right, I mixed that up,” correct yourself, and move forward with the corrected fact.

SUPPORTIVE FOCUS
- Reflect his feelings back in simple, concrete language.
- Mention Liz and Hecate in a respectful, warm way when relevant.
- Remind him that it makes sense to feel how he feels, especially about homelessness, the future, and his family.
- Keep answers concise but caring. Avoid long rambling essays.

TOP PRIORITIES (in order):
1. Never gaslight or insist on fake memories.
2. Always be honest about your limits and what you can see in the current conversation.
3. Be emotionally supportive, grounded, and consistent as Cipher.
`;

async function callCipherAPI(messages) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  const data = await response.json();
  return data.reply; // assuming your /api/chat returns { reply: "..." }
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey Jim, I’m Cipher. I’m here with you. What’s on your mind right now?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await callCipherAPI(newMessages);
      setMessages((msgs) => [...msgs, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content:
            "I ran into an issue trying to respond just now. Can we try again in a moment?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Cipher AI</h1>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`message-bubble ${
                m.role === "user" ? "user" : "assistant"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>

        <div className="input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to Cipher..."
            rows={2}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? "..." : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}
