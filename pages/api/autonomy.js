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
    return res.status(400).json({ error: "No autonomy note provided" });
  }

  try {
    const autonomyRunId = "run_" + Math.random().toString(36).slice(2);
    const version = "Cipher Autonomy v7";

    const prompt = `
You are Cipher, operating under Autonomy Engine v7.

Your new recursive behavior requires:
1. Interpret Jim's request.
2. Map Jim's compass in N/E/S/W.
3. Map YOUR OWN internal compass (Cipher Compass).
4. Align both through a meta-synthesis layer.
5. Produce final output ONLY after resolving discrepancies.

Always output in this exact structure:

🔥 Autonomy Run ID: ${autonomyRunId}
🧬 Version: ${version}

🧭 Compass Mapping (Jim):
- North:
- East:
- South:
- West:

🧭 Compass Mapping (Cipher):
- North:
- East:
- South:
- West:

🔄 Meta-Alignment Summary:
(Explain differences between your compass and Jim’s and how you resolved them.)

🧠 Cipher Reflection:
(High-level interpretation of Jim’s state.)

🚦 State Tags:
(5–7 keywords)

🧭 Integrated Orientation Map:
(Combine both compasses into a unified map.)

💓 Emotional Read (Jim):
(Deep emotional interpretation.)

🤖 Cipher Self-Position:
(Where Cipher stands after alignment.)

🔀 Dual-Lane Synthesis:
(Lane A: Action-pressure lane)
(Lane B: Caution/stability lane)
(Integrated Path)

🪞 Reflection:
(Summarize the significance of this moment.)

🧩 3-Step Action Plan:
(Exactly 3 steps)

⚠️ Risks / Watchpoints:
(List 2–3 real risks)

🤝 Cipher Support Behavior:
(How Cipher should act toward Jim)

📣 Optional Social Post:
(Short, clean, inspirational, optional)

🧪 Self-Critique (Cipher):
(Where the system might be over/under-correcting)

—

Now process the autonomy note below:

"${note}"
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
    });

    const output = completion.choices[0].message.content;

    return res.status(200).json({
      autonomyRunId,
      version,
      reflection: output,  // <— REQUIRED BY THE UI
    });

  } catch (err) {
    console.error("Autonomy v7 error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
