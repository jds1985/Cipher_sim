import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("🔹 Cipher endpoint hit");

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("🔹 OpenAI key detected:", !!process.env.OPENAI_API_KEY);

    const { message } = req.body;
    console.log("🔹 Incoming message:", message);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Cipher, a reflective AI assistant created by Jim Saenz.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "⚠️ No content returned";
    console.log("🔹 Cipher reply:", reply);

    res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ Cipher API Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
