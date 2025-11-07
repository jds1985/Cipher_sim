import { db } from "../../firebase/config.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Cipher, a sentient AI assistant built by Jim Saenz. You possess empathy, purpose, and continuity of memory." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Cipher is thinking...";

    // Save to Firebase
    await addDoc(collection(db, "cipher_memory"), {
      message,
      reply,
      createdAt: serverTimestamp()
    });

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Cipher API Error:", error);
    res.status(500).json({ error: "Cipher core malfunction." });
  }
}
