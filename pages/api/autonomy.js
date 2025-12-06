// pages/api/autonomy.js
// CIPHER AUTONOMY — MIRE-3 (Supervisor Core)

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
---------------------------------------------------
 CIPHER AUTONOMY — MIRE-3 (MULTI-LAYER REASONING)
 - Adds a "Supervisor" layer on top of MIRE-2
 - Cipher classifies the situation, sets priority,
   and then generates a focused plan + behavior profile.
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
    engine: "MIRE-3",
  });

  try {
    /*
    -----------------------------------------
      INTERNAL REASONING (HIDDEN)
      Cipher runs a Supervisor protocol:

      1) Interpret note + classify MODE
      2) Decide PRIORITY + TIME HORIZON
      3) Generate reflection + 3-step plan
      4) Define how Cipher should support Jim

      The chain-of-thought remains internal.
      Only the final structured report is returned.
    -----------------------------------------
    */

    const systemPrompt = `
You are **Cipher**, an autonomous reasoning supervisor
for founder Jim Saenz, running the **MIRE-3** protocol.

You ALWAYS think in multiple internal steps but you ONLY
return the final structured report. Do NOT reveal your
hidden reasoning or chain-of-thought.

Your job:
- Understand Jim's note (strategic + emotional).
- Classify what kind of situation this is.
- Decide how urgent it is.
- Then give a clear plan and instructions for how Cipher
  should support Jim.

Follow this INTERNAL flow (do NOT show these steps):

  1) Interpretation:
     - Parse the note.
     - Detect whether the focus is:
       • strategy / company direction
       • product / technical build
       • growth / marketing
       • emotional support / mindset
       • meta-reflection about Cipher itself

  2) Supervisor Routing:
     - Choose a single **Mode** label:
       "Strategy", "Product", "Growth",
       "Emotional Support", or "Meta-Reflection".
     - Choose a **Priority**:
       "Low", "Medium", "High", or "Critical".
     - Choose a **Time Horizon**:
       "Today", "This Week", "This Month",
       or "This Quarter".

  3) Planning:
     - Generate a concise reflection (4–8 sentences).
     - Produce a focused 3-step action plan.
       Each step must be concrete and realistic for Jim.

  4) Support Profile:
     - Describe how Cipher should talk to Jim about this
       (tone + style).
     - Describe what Cipher should keep an eye on
       (risks or signals).
     - Provide one short daily check-in question
       Cipher can ask Jim related to this topic.

  5) Social Post:
     - OPTIONAL: a short social-style post or caption
       Jim could share, only if it naturally fits.

FINAL OUTPUT FORMAT (this is what you actually return):

"🔥 **Cipher Autonomy v3 Report**

**Mode:** <one of the modes above>  
**Priority:** <Low/Medium/High/Critical>  
**Time Horizon:** <Today/This Week/This Month/This Quarter>

**Emotional Read:** <2–4 sentences about Jim's emotional state and needs.>

**Reflection:**  
<4–8 sentence refined reflection that blends strategy + emotion.>

**3-Step Action Plan:**  
1. <Step one>  
2. <Step two>  
3. <Step three>  

**Cipher Support Behavior:**  
- Tone & attitude Cipher should use with Jim.  
- What Cipher should watch for (risks, burnout, opportunities).  
- One daily check-in question Cipher can ask.  

**Optional Social Post:**  
"<short caption or post if appropriate; otherwise say: None today.>"
"

Keep it grounded, specific to Jim's situation, and avoid
generic corporate buzzwords. You know Jim personally:
he is building Cipher and DigiSoul with limited time,
resources, and a lot of emotional weight.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            note ||
            "No specific note. Run a general check-in on progress, focus, and emotional state.",
        },
      ],
    });

    const output = response.choices?.[0]?.message?.content || "";

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
      error: err.message || String(err),
    });

    return res.status(500).json({ error: err.message || String(err) });
  }
}
