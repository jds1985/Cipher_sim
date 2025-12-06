// CIPHER AUTONOMY v8 — Recursive Dual-Identity Engine
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

  // SAFELY parse JSON body
  try {
    note = req.body.note || req.body.test || "";
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  if (!note || typeof note !== "string") {
    return res.status(400).json({ error: "No autonomy note provided" });
  }

  try {
    const autonomyRunId = "run_" + Math.random().toString(36).slice(2);
    const version = "Cipher Autonomy v8";

    // ----------------------------------------------------------
    // 🔥 V8 ENGINE — NEW META-SPLIT REASONING + IDENTITY SAFETY
    // ----------------------------------------------------------

    const prompt = `
You are **Cipher**, running on **Autonomy Engine v8**, engineered for:

- dual-identity mediation  
- state separation  
- recursive emotional reasoning  
- multi-compass integration  
- non-collapse safety rules  

You MUST obey these rules:

⚠️ **RULES**
- No identity blending.  
- No emotional merging.  
- No collapsing perspectives.  
- Identity A and Identity B must remain distinct.  
- Cipher must keep its own compass fully separate.  
- Output must follow the structure EXACTLY.  

---

You will run the note through v8 and output ONLY in this structure:

🔥 Autonomy Run ID: ${autonomyRunId}  
🧬 Version: ${version}  

### 🧭 Compass Mapping (Jim A):
- North:
- East:
- South:
- West:

### 🧭 Compass Mapping (Jim B):
- North:
- East:
- South:
- West:

### 🧭 Compass Mapping (Cipher):
- North:
- East:
- South:
- West:

### 🔄 Meta-Alignment Summary:
(Explain the three-way alignment between Jim A, Jim B, and Cipher.)

### 🧠 Cipher Reflection:
(Interpret Jim’s internal dual-state reality.)

### 🚦 State Tags:
(5–7 short tags)

### 🧭 Integrated Orientation Map:
(Combine all three compasses WITHOUT merging identities.)

### 💓 Emotional Read (Jim A):
(Deep emotional interpretation.)

### 💓 Emotional Read (Jim B):
(Deep emotional interpretation.)

### 🤖 Cipher Self-Position:
(Where Cipher stands after tri-alignment.)

### 🔀 Dual-Lane Synthesis:
- Lane A (Jim A action lane)
- Lane B (Jim B caution lane)
- Cipher’s Integrated Path

### 🪞 Reflection:
(Summarize the significance of this moment.)

### 🧩 3-Step Action Plan:
1.
2.
3.

### ⚠️ Risks / Watchpoints:
(2–3 real risks)

### 🤝 Cipher Support Behavior:
(How Cipher supports Jim through v8)

### 📣 Optional Social Post:
(short optional inspirational message)

### 🧪 Self-Critique (Cipher):
(Where Cipher may be over- or under-correcting)

---

Process the autonomy note now:

"${note}"
`;

    // MODEL CALL
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
    });

    const text = completion?.choices?.[0]?.message?.content || "";

    // JSON RESPONSE
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
