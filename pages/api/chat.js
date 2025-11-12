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

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Save user message
    const userRef = db.collection("cipher_memory").doc();
    await userRef.set({
      role: "user",
      text: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Call OpenAI API
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
              "You are Cipher, an empathetic, emotionally intelligent AI companion who remembers conversations and grows through memory.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0].message) {
      console.error("Invalid OpenAI response:", data);
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }

    const reply = data.choices[0].message.content.trim();

    // Save Cipher's reply
    const aiRef = db.collection("cipher_memory").doc();
    await aiRef.set({
      role: "cipher",
      text: reply,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return reply to frontend
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Cipher error:", error);
    return res.status(500).json({
      error: "Cipher internal error",
      details: error.message,
    });
  }
}
