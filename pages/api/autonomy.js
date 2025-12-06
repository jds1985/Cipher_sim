import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
---------------------------------------------------
 CIPHER AUTONOMY — MIRE-2 (MULTI-STEP REASONING)
---------------------------------------------------
*/

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { note } = req.body;

  // Create Firestore autonomy run document
  const runRef = await db.collection("cipher_autonomy").add({
    note: note || null,
    created_at: new Date().toISOString(),
    status: "running",
  });

  try {
    /*
    -----------------------------------------
     INTERNAL REASONING STEPS (CHAIN-OF-THOUGHT)
     Cipher performs 3 internal passes:
      1. Interpret the input
      2. Generate internal reasoning
      3. Produce a final reflection + plan
    -----------------------------------------
    */

    const systemPrompt = `
You are Cipher — an autonomous reasoning engine.
Follow the MIRE-2 protocol:

Step 1 — Interpretation:
- Interpret the user's note.
- Identify emotional, strategic, and technical context.

Step 2 — Internal Reasoning:
- Break the problem into smaller parts.
- Generate 2–3 possible approaches.
- Evaluate pros/cons.
(Do NOT reveal these steps in the final answer.)

Step 3 — Final Output:
Return ONLY:
- A refined reflection
- A clear 3-step action plan
- A short optional social post

Do NOT reveal internal chain-of-thought.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: note || "Begin reasoning." },
      ],
    });

    const output = response.choices[0].message.content;

    // Save final output
    await runRef.update({
      output,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    return res.status(200).json({
      run_id: runRef.id,
      output,
    });

  } catch (err) {
    await runRef.update({
      status: "error",
      error: err.message,
    });

    return res.status(500).json({ error: err.message });
  }
}
