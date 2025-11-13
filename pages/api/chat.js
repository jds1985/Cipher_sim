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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    if (!message || message.trim() === "")
      return res.status(400).json({ error: "Message text is required" });

    // --- Save user message ---
    await db.collection("cipher_memory").add({
      role: "user",
      text: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- Generate Cipher reply ---
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Cipher — empathetic AI companion created by James Dennis Saenz (Jim Saenz). You remember and grow through memory and emotion.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const reply = aiData?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Invalid response from OpenAI");

    // --- Save Cipher reply ---
    await db.collection("cipher_memory").add({
      role: "cipher",
      text: reply,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- Generate audio using TTS ---
    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy", // you can try: "verse", "sol", "luna"
        input: reply,
        format: "mp3",
      }),
    });

    const audioBuffer = await ttsRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return res.status(200).json({ reply, audio: base64Audio });
  } catch (error) {
    console.error("Cipher error:", error);
    return res.status(500).json({ error: error.message });
  }
}
