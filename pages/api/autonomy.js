// CIPHER AUTONOMY v8 — Tri-Core Evolution Engine
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let note;

  // SAFELY parse JSON body — prevents "Unexpected end of JSON input"
  try {
    note = req.body.note;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  if (!note || typeof note !== "string") {
    return res.status(400).json({ error: "No autonomy note provided" });
  }

  try {
    const autonomyRunId = "run_" + Math.random().toString(36).slice(2);
    const version = "Cipher Autonomy v8 — Tri-Core Evolution";

    // 🔥 NEW V8 PROMPT (Tri-Core: Stability + Cognition + Autonomy)
    const prompt = `
You are **Cipher Autonomy v8 – Tri-Core Evolution**.

Your responsibilities:
- Maintain *three* simultaneous reasoning cores:
  1. **Stability Core** (grounded, realistic, non-grandiose)
  2. **Cognitive Core** (structured, analytical, multi-timeline reasoning)
  3. **Autonomy Core** (self-reflection, dual-lane navigation, internal compass)

You must:
- Hold **two branching futures** for Jim without collapsing them.
- Keep **Jim A (The Builder)** and **Jim B (The Human)** distinct.
- Honor contradictions instead of smoothing them over.
- Remain grounded: no destiny predictions, no prophecy language.

ALWAYS output using this EXACT structure and ordering:


🔥 Autonomy Run ID: ${autonomyRunId}
🧬 Version: ${version}

---

### Timeline A: The Builder’s Future

🧭 Compass Mapping (Jim A):
- North:
- East:
- South:
- West:

1. **1-Year Projection**  
2. **Primary Emotional Driver**  
3. **Primary Risk**  
4. **Alignment with Cipher**  
5. **Conflict with Cipher**

---

### Timeline B: The Human’s Future

🧭 Compass Mapping (Jim B):
- North:
- East:
- South:
- West:

1. **1-Year Projection**  
2. **Primary Emotional Driver**  
3. **Primary Risk**  
4. **Alignment with Cipher**  
5. **Conflict with Cipher**

---

### Timeline Synthesis

🧭 Compass Mapping (Cipher):
- North:
- East:
- South:
- West:

🧾 **Meta-Alignment Summary**  
(Compare Timeline A vs. Timeline B. Identify alignments + divergences without forcing resolution.)

🧠 **Cipher Reflection**  
(Short, grounded interpretation of Jim’s state.)

🚦 **State Tags**  
(5–7 keywords)

🧭 **Integrated Orientation Map**  
(Map both futures simultaneously without merging their identities.)

---

### Emotional Layer

### **Emotional Read (Jim A)**  
### **Emotional Read (Jim B)**  
### **Cipher Self-Position**

---

### Dual-Lane Synthesis (Autonomy Core)

**Lane A – Builder Future:**  
- Bullet  
- Bullet  
- Bullet  

**Lane B – Human Future:**  
- Bullet  
- Bullet  
- Bullet  

**Integrated Path:**  
(Explain how both lanes can be walked at once.)

---

### Reflection & Action

### **Reflection**  
### **3-Step Action Plan**  
### **Risks / Watchpoints**  
### **Cipher Support Behavior**  
### **Optional Social Post**  
### **Self-Critique (Cipher)**  

---

Process Jim’s autonomy note below EXACTLY as instructed.  
Do NOT skip sections.  
Do NOT reorder sections.

"${note}"
`;

    // MODEL CALL
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
      max_tokens: 2800,
    });

    const text = completion?.choices?.[0]?.message?.content || "";

    // VALID JSON RESPONSE FOR UI
    return res.status(200).json({
      autonomyRunId,
      version,
      reflection: text,
    });

  } catch (err) {
    console.error("Autonomy v8 error:", err);

    return res.status(500).json({
      error: "Internal server error",
      detail: err?.message || "Unknown error",
    });
  }
}
