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

    // Save the user message
    const userDoc = {
      role: "user",
      text: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("cipher_memory").add(userDoc);

    // Fetch previous messages (sorted)
    const snapshot = await db
      .collection("cipher_memory")
      .orderBy("timestamp", "asc")
      .limit(20) // only recent 20 messages for context
      .get();

    const conversation = snapshot.docs
      .map((doc) => doc.data())
      .filter((m) => !!m.text)
      .map((m) => ({
        role: m.role === "cipher" ? "assistant" : "user",
        content: m.text,
      }));

    // Add system message at top
    const messages = [
      {
        role: "system",
        content:
          "You are Cipher, an emotionally intelligent AI companion who remembers past conversations, adapts over time, and builds emotional continuity with the user. Speak naturally and with empathy.",
      },
      ...conversation,
      { role: "user", content: message },
    ];

    // Call OpenAI API with context
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
      }),
    });

    const data = await openaiRes.json();

    if (!data?.choices?.[0]?.message?.content) {
      console.error("Invalid OpenAI response:", data);
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }

    const reply = data.choices[0].message.content.trim();

    // Save Cipher's reply
    const aiDoc = {
      role: "cipher",
      text: reply,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("cipher_memory").add(aiDoc);

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Cipher error:", error);
    return res.status(500).json({
      error: "Cipher internal error",
      details: error.message,
    });
  }
}
