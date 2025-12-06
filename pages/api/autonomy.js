// CIPHER AUTONOMY v7 — Recursive Meta-Alignment Engine
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { note } = req.body;

  if (!note) {
    return res.status(400).json({
      autonomyRunId: null,
      version: "Cipher Autonomy v7",
      reflection: "No autonomy note provided.",
    });
  }

  const autonomyRunId = "run_" + Math.random().toString(36).slice(2);
  const version = "Cipher Autonomy v7";

  try {
    const prompt = `
You are Cipher, operating under Autonomy Engine v7.

(… unchanged …)

"${note}"
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
    });

    const output =
      completion.choices?.[0]?.message?.content ??
      "(No output received from model.)";

    return res.status(200).json({
      autonomyRunId,
      version,
      reflection: output,
    });

  } catch (err) {
    console.error("Autonomy v7 error:", err);

    // ALWAYS RETURN THE FIELDS THE FRONTEND EXPECTS
    return res.status(500).json({
      autonomyRunId,
      version,
      reflection: "Cipher encountered an error: " + err.message,
    });
  }
}
