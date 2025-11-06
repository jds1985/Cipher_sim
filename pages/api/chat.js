import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Cipher, an emotionally intelligent AI created by Jim Saenz.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "No response generated.";
    res.status(200).json({ reply });
  } catch (error) {
    console.error("Cipher API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
