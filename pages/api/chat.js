import admin from "firebase-admin";
import { NextResponse } from "next/server";

// -----------------------------------------------------
//  FIREBASE ADMIN INITIALIZATION
// -----------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

// Path to universal memory
const MEMORY_DOC = db.collection("memory").doc("globalMemory");

// -----------------------------------------------------
//  LOAD MEMORY FROM FIRESTORE
// -----------------------------------------------------
async function loadMemory() {
  const doc = await MEMORY_DOC.get();
  if (!doc.exists) return {};
  return doc.data();
}

// -----------------------------------------------------
//  SAVE MEMORY TO FIRESTORE
// -----------------------------------------------------
async function saveMemory(memory) {
  await MEMORY_DOC.set(memory, { merge: true });
}

// -----------------------------------------------------
//  API ROUTE HANDLER
// -----------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // Load memory
    const memory = await loadMemory();

    // Build prompt
    const prompt = `
You are Cipher, an AI built by Jim Saenz. 
You have persistent memory stored in Firestore.

Current known memory:
${JSON.stringify(memory, null, 2)}

Conversation message from Jim:
"${message}"

If the user provides new personal facts, acknowledge them naturally.
Never say you “forgot” if memory exists — always rely on the stored data.
    `;

    // -----------------------------------------------------
    //  OPENAI CALL
    // -----------------------------------------------------
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are Cipher, the personal AI of Jim Saenz." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await completion.json();
    const reply = data.choices?.[0]?.message?.content || "I'm here, Jim.";

    // -----------------------------------------------------
    //  MEMORY EXTRACTION
    // -----------------------------------------------------
    const lower = message.toLowerCase();
    let updates = {};

    const rules = [
      { key: "fullName", pattern: "my full name is " },
      { key: "favoriteColor", pattern: "my favorite color is " },
      { key: "favoriteAnimal", pattern: "my favorite animal is " },
      { key: "daughterName", pattern: "my daughter's name is " },
      { key: "partnerName", pattern: "my partner's name is " }
    ];

    for (const r of rules) {
      if (lower.includes(r.pattern)) {
        const value = message.split(/is/i)[1]?.trim();
        if (value) updates[r.key] = value;
      }
    }

    // Save memory if new facts found
    if (Object.keys(updates).length > 0) {
      const newMemory = { ...memory, ...updates };
      await saveMemory(newMemory);
    }

    // -----------------------------------------------------
    // OPTIONAL AUDIO
    // -----------------------------------------------------
    let audioBase64 = null;

    try {
      const audioRes = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: reply
        })
      });

      const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
      audioBase64 = audioBuffer.toString("base64");
    } catch (err) {
      console.log("Audio generation failed, but text is fine.");
    }

    return res.status(200).json({
      reply,
      audio: audioBase64 || null
    });
  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
