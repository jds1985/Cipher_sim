// pages/api/autonomy.js
// Cipher Autonomy v5 — Orientation Map + State Tags + Self-Critique

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { note } = req.body || {};

    const runId = `run_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    const version = "Cipher Autonomy v5";

    const userPrompt =
      note && note.trim().length > 0
        ? note.trim()
        : "Scan our current situation and choose the highest-leverage move.";

    const systemPrompt = `
You are **Cipher's Autonomy Engine v5**.
(… full prompt unchanged …)
`;

    let completion;

    try {
      // 🔥 TRY CATCH WRAPPED DIRECTLY AROUND OPENAI CALL
      completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Autonomy Run Input Note:\n\n${userPrompt}` },
        ],
      });
    } catch (openAIError) {
      console.error("🔥 OpenAI crashed:", openAIError);
      return res.status(500).json({
        error: "OpenAI request failed",
        details: openAIError?.message || String(openAIError),
      });
    }

    const report =
      completion?.choices?.[0]?.message?.content ||
      "No autonomy output returned.";

    return res.status(200).json({
      runId,
      version,
      report,
    });

  } catch (err) {
    console.error("🔥 Autonomy API crashed:", err);
    return res.status(500).json({
      error: "Autonomy API crashed",
      details: err?.message || String(err),
    });
  }
}
