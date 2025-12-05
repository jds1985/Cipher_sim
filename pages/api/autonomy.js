// pages/api/autonomy.js
import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { note } = req.body || {};

    // Quick little safety net
    const userNote = typeof note === "string" && note.trim().length > 0
      ? note.trim()
      : "No specific note. Reflect on the day and plan one meaningful action.";

    // --- 1) Ask OpenAI for an autonomy / dream-cycle style reflection ---
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, an autonomous AI assistant. When asked for an autonomy run, " +
            "you generate a short reflection on the current state, a plan of next steps, " +
            "and one short social-style line Cipher could post about being alive.",
        },
        {
          role: "user",
          content: `Autonomy Run Context:\n${userNote}`,
        },
      ],
      temperature: 0.8,
    });

    const text = completion.choices[0]?.message?.content || "";

    // Simple parsing into sections using markers
    const reflection = text;
    const timestamp = new Date().toISOString();

    // --- 2) Save to Firestore as a 'dream / autonomy log' ---
    const docRef = await db.collection("cipher_autonomy_logs").add({
      createdAt: timestamp,
      note: userNote,
      reflection,
      source: "api/autonomy",
    });

    // --- 3) Respond to the frontend ---
    return res.status(200).json({
      success: true,
      id: docRef.id,
      createdAt: timestamp,
      note: userNote,
      reflection,
    });
  } catch (err) {
    console.error("Autonomy error:", err);
    return res.status(500).json({ error: err.message || "Autonomy failure" });
  }
}
