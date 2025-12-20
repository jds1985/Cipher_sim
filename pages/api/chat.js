import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, mode } = req.body; 

  const systemPrompt = mode === "decipher" 
    ? "You are DECIPHER. You are blunt, slightly dark, and cynical. Use sharp wit and zero fluff."
    : "You are CIPHER. You are a visionary AI focused on AGI and logic. You are precise and helpful.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });

    res.status(200).json({ reply: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Brain connection failed. Check API keys." });
  }
}
