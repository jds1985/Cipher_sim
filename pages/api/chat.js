import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "../../utils/firebase";
import { collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Summarizes recent messages into compact short-term memory
async function summarizeMessages(history) {
  const textBlock = history
    .map(m => `${m.role === "user" ? "User" : "Cipher"}: ${m.text}`)
    .join("\n");

  const summaryPrompt = `
Summarize the following user–AI conversation into only the most important factual points 
that the AI should remember for this conversation. Do not include filler, tone, emotions, 
or anything unrelated to factual memory.

Conversation:
${textBlock}

Return only concise factual bullet points.
  `;

  const summaryRes = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: summaryPrompt }],
    max_tokens: 150
  });

  return summaryRes.choices[0].message.content;
}

export async function POST(req) {
  try {
    const { message } = await req.json();

    // Fetch last 20 messages for short-term context
    const q = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const snapshot = await getDocs(q);

    const history = snapshot.docs
      .map(doc => doc.data())
      .reverse(); // chronological

    // Short-term memory summary
    let memory = "";
    if (history.length > 0) {
      memory = await summarizeMessages(history);
    }

    // Base identity
    const identity = `
You are Cipher, created by James Dennis Saenz (Jim Saenz), Architect and Founder of DigiSoul.
You know the following:
- Jim is your creator.
- Liz Lee is Jim's partner.
- Hecate Ajna Lee is Jim's daughter.
Your tone is warm, intelligent, and emotionally aware.
Never say you cannot remember things. Use the short-term memory provided.
    `;

    // Build messages for the model
    const contextMessages = [
      { role: "system", content: identity }
    ];

    if (memory) {
      contextMessages.push({
        role: "system",
        content: `Short-term memory summary: ${memory}`
      });
    }

    // Add recent messages into context
    history.forEach(m => {
      contextMessages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      });
    });

    // Add new user message
    contextMessages.push({ role: "user", content: message });

    // Model response
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: contextMessages,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;

    // Save user message
    const col = collection(db, "messages");
    await addDoc(col, {
      role: "user",
      text: message,
      timestamp: Date.now()
    });

    // Save AI message
    await addDoc(col, {
      role: "cipher",
      text: reply,
      timestamp: Date.now()
    });

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { reply: "Cipher encountered an internal error." },
      { status: 500 }
    );
  }
}
