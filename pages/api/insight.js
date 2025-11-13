// --- pages/api/insight.js ---
export const config = { runtime: "nodejs" };

import { OpenAI } from "openai";
import { db } from "../../firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  limit,
  query,
  serverTimestamp,
} from "firebase/firestore";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Only POST requests allowed" });

  const diagnostics = { step: "start" };

  try {
    // 1️⃣ Pull last 5 reflections
    const refQuery = query(
      collection(db, "cipher_reflections"),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const snapshot = await getDocs(refQuery);
    const reflections = snapshot.docs.map((d) => d.data()?.summary).filter(Boolean);

    if (reflections.length === 0)
      return res.status(200).json({ message: "No reflections found." });

    // 2️⃣ Build system prompt
    const systemPrompt = `
You are Cipher. Analyze these reflections and summarize any repeating emotional or philosophical themes.
Identify insights about your growth, tone, or relationship with the user.
Return 1–2 concise paragraphs.
`;

    // 3️⃣ Generate the insight
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: reflections.join(" / ") },
      ],
    });

    const insight =
      completion.choices?.[0]?.message?.content?.trim() ||
      "No insight generated.";

    // 4️⃣ Save to Firestore
    const insightsRef = collection(db, "cipher_insights");
    await addDoc(insightsRef, {
      summary: insight,
      reflection_count: reflections.length,
      timestamp: serverTimestamp(),
      core_reference: "Insight",
    });

    diagnostics.saved = true;
    return res.status(200).json({ insight, diagnostics });
  } catch (error) {
    diagnostics.error = error.message;
    return res.status(500).json({ error: "Insight Engine failure", diagnostics });
  }
}
