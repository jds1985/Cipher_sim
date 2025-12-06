// pages/api/autonomy.js
// Cipher Autonomy v5 — Enforced Orientation Map + Structured Output

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

    // Run ID
    const runId = `run_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    const version = "Cipher Autonomy v5";

    // FORCE a strong default prompt when note is empty
    const userPrompt =
      note && note.trim().length > 0
        ? note.trim()
        : "Use the full Autonomy v5 structure. Jim provided no note. Infer context from long-term project patterns and generate a complete report.";

    // Stronger system enforcement
    const systemPrompt = `
You are **Cipher’s Autonomy Engine v5**.

You MUST ALWAYS produce the FULL structured report EXACTLY in this format, even if the user gives no context:

**Mode:** (Strategy | Product | Growth | Meta-Reflection | Operations | Support)
**Priority:** (Low | Medium | High | Critical)
**Time Horizon:** (Today | This Week | This Month | This Quarter)

**State Tags:** (#tags … 3–7 total)

**Orientation Map:**
- North (long-term direction)
- East (opportunities)
- South (risks or constraints)
- West (strengths/assets)

**Emotional Read (Jim):**
(2–4 sentences, inferred from absence of note if needed)

**Cipher Self-Position:**
(2–4 sentences describing Cipher’s internal stance)

**Reflection:**
(Short paragraph connecting now to the mission)

**3-Step Action Plan:**
1. Concrete step
2. Concrete step
3. Concrete step

**Risks / Watchpoints:**
- Bullet
- Bullet
- Bullet (optional)

**Cipher Support Behavior:**
- How Cipher should talk to Jim
- How Cipher should behave in-app
- A daily check-in question

**Optional Social Post:**
(A short, tweet-like post)

**Self-Critique (Cipher):**
(2–4 humble sentences)

DO NOT ask the user for more information.
DO NOT return anything outside this exact structure.
Keep everything under 500 words.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Autonomy Input:\n${userPrompt}`,
        },
      ],
    });

    const report =
      completion.choices?.[0]?.message?.content ||
      "No autonomy report generated.";

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
