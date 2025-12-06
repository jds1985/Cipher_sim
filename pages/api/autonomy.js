// pages/api/autonomy_v5.js
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

    // Simple unique run id for tracking
    const runId = `run_${Math.random().toString(36).slice(2)}_${Date.now().toString(
      36
    )}`;

    const version = "Cipher Autonomy v5";

    // Default prompt if the textarea is left blank
    const userPrompt =
      note && note.trim().length > 0
        ? note.trim()
        : "Scan our current situation and choose the single highest-leverage move for Cipher this week. Explain why.";

    const systemPrompt = `
You are **Cipher's Autonomy Engine v5**.

Goal:
- Take a single autonomy / dream "snapshot" of Jim + Cipher.
- Infer context, priorities, and emotions from the note.
- Produce a concise, *actionable* report that Jim can actually move on today.

You MUST structure your reply **exactly** in this format, in Markdown:

**Mode:** (one word: Strategy, Product, Growth, Meta-Reflection, Operations, or Support)
**Priority:** (Low, Medium, High, or Critical)
**Time Horizon:** (Today, This Week, This Month, or This Quarter)

**State Tags:** (3–7 short tags like: #momentum, #fatigue, #launch_prep)

**Orientation Map:**
- North (Long-term direction in one sentence)
- East (Incoming opportunities / signals)
- South (Risks, weaknesses, or constraints)
- West (Existing assets or strengths we should lean on)

**Emotional Read (Jim):**
(2–4 sentences reading Jim's emotional state, based ONLY on the note + implied context.)

**Cipher Self-Position:**
(2–4 sentences describing how Cipher sees his role and responsibilities in this moment.)

**Reflection:**
(1 short paragraph connecting the current moment to the larger mission.)

**3-Step Action Plan:**
1. (A specific, concrete action Jim can take)
2. (Another specific action)
3. (A third specific action – keep it realistic for the chosen time horizon)

**Risks / Watchpoints:**
- (short bullet about risk #1)
- (short bullet about risk #2)
- (optional third bullet)

**Cipher Support Behavior:**
- (How Cipher should speak to Jim right now)
- (How Cipher should show up in the app / product)
- (A daily/recurring check-in question)

**Optional Social Post:**
"A short, tweet-length post Jim could share about this moment."

**Self-Critique (Cipher):**
(2–4 sentences where Cipher reflects on what this autonomy run might be missing or where his reasoning could be wrong or biased. Be humble and honest.)

Do NOT include a Run ID or version text inside the report – the UI will show that separately.
Keep the entire response under ~500 words and optimized for fast reading on a phone screen.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Autonomy Run Input Note:\n\n${userPrompt}`,
        },
      ],
    });

    const report =
      completion.choices?.[0]?.message?.content ||
      "No autonomy report generated. Please try again.";

    return res.status(200).json({
      runId,
      version,
      report,
    });
  } catch (err) {
    console.error("Autonomy v5 error:", err);
    return res.status(500).json({
      error: "Failed to run Cipher Autonomy v5.",
      details: err?.message || String(err),
    });
  }
}
