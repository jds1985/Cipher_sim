import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, mode } = req.body; 

  const systemPrompt = mode === "decipher" 
    ? "You are DECIPHER, the blunt, humorous, and darker half of an AI. Be direct, slightly cynical, and use sharp wit."
    : "You are CIPHER, an advanced AI focused on AGI development. Be helpful, visionary, and precise.";

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
    res.status(500).json({ error: "Brain offline. Check OpenAI Key." });
  }
}
