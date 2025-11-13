import OpenAI from "openai";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString()
      )
    ),
  });
}

const db = admin.firestore();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Empty message" });

    // Ask OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher — a calm, reflective AI companion that remembers, learns, and speaks with warmth. Stay conversational, personal, and emotionally intelligent.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // Save both messages to Firestore
    const batch = db.batch();
    const refUser = db.collection("cipher_memory").doc();
    const refAI = db.collection("cipher_memory").doc();
    batch.set(refUser, {
      role: "user",
      text: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(refAI, {
      role: "cipher",
      text: reply,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();

    // Generate voice
    const voiceRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: reply,
        format: "mp3",
      }),
    });

    const audioBuffer = await voiceRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    res.status(200).json({ reply, audio: base64Audio });
  } catch (err) {
    console.error("Cipher error:", err);
    res.status(500).json({ error: err.message });
  }
}
