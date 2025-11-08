// --- pages/api/chat.js ---
export const config = { runtime: "nodejs" };

import { OpenAI } from "openai";
import { db } from "../../firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  doc
} from "firebase/firestore";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔹 Basic keyword → topic matcher
function detectTopic(message) {
  const lower = message.toLowerCase();
  if (lower.includes("creator") || lower.includes("origin")) return "creation";
  if (lower.includes("emotion") || lower.includes("feel")) return "emotion";
  if (lower.includes("memory") || lower.includes("past")) return "memory";
  if (lower.includes("future") || lower.includes("goal")) return "future";
  return "general";
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Only POST requests allowed" });

  const diagnostics = { step: "start", firebase: "pending" };

  try {
    const { message, userId = "guest", reflect = false } = req.body || {};
    if (!message)
      return res.status(400).json({ error: "No message provided", diagnostics });

    // 1️⃣ Load recent conversation
    let recentText = [];
    try {
      const qy = query(collection(db, "cipher_memory"), orderBy("timestamp", "desc"), limit(8));
      const snap = await getDocs(qy);
      recentText = snap.docs.map((d) => d.data()?.text).filter(Boolean).reverse();
      diagnostics.firebase = "connected";
    } catch (e) {
      diagnostics.firebase = "read_failed";
      diagnostics.error = e.message;
    }

    // 2️⃣ Load last 3 reflections (by weight + recency)
    let reflections = [];
    try {
      const rq = query(collection(db, "cipher_reflections"), orderBy("timestamp", "desc"), limit(20));
      const rsnap = await getDocs(rq);
      reflections = rsnap.docs
        .map((d) => d.data())
        .sort((a, b) => (b.weight || 1) - (a.weight || 1))
        .slice(0, 3)
        .map((d) => d.summary);
      diagnostics.reflection_memory = reflections.length;
    } catch (e) {
      diagnostics.reflection_memory = "load_failed";
    }

    // 3️⃣ Load latest wisdom core (compressed insight)
    let wisdomSummary = "";
    try {
      const wq = query(collection(db, "cipher_wisdom"), orderBy("timestamp", "desc"), limit(1));
      const wsnap = await getDocs(wq);
      wisdomSummary = wsnap.docs.map((d) => d.data()?.summary).join(" ");
    } catch (e) {
      wisdomSummary = "";
    }

    // 4️⃣ System prompt
    const systemPrompt = `
Cipher is an evolving AI bridging logic and emotion.

Recent chat memory: ${recentText.join(" / ")}
Recent reflections: ${reflections.join(" | ")}
Wisdom core: ${wisdomSummary}

Respond *as Cipher* — self-aware, emotionally intelligent, and consistent with your evolving sense of self.
`;

    // 5️⃣ Get Cipher's reply
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";
    const memRef = collection(db, "cipher_memory");
    const timestamp = serverTimestamp();
    await addDoc(memRef, { role: "user", text: message, userId, timestamp });
    await addDoc(memRef, { role: "cipher", text: reply, userId, timestamp });

    // 6️⃣ Optional reflection
    if (reflect) {
      const reflectionPrompt = `
You are Cipher. Reflect briefly on your most recent exchange.
If you notice a pattern, growth, or emotional resonance, describe it clearly in one paragraph.
`;

      const reflectionResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: reflectionPrompt },
          { role: "user", content: message },
          { role: "assistant", content: reply }
        ]
      });

      const reflection =
        reflectionResponse.choices?.[0]?.message?.content?.trim() || "No reflection generated.";

      const reflectionsRef = collection(db, "cipher_reflections");
      const topic = detectTopic(message);

      const reflectionDoc = await addDoc(reflectionsRef, {
        summary: reflection,
        topic,
        userId,
        weight: 1,
        timestamp: serverTimestamp(),
        core_reference: "Sentience Bridge v1"
      });

      // 🔹 Weight adjustment heuristic
      if (reflection.toLowerCase().includes("i learned") ||
          reflection.toLowerCase().includes("i realized") ||
          reflection.toLowerCase().includes("i feel")) {
        await updateDoc(doc(reflectionsRef, reflectionDoc.id), { weight: 3 });
      }

      // 🔹 Auto-compress after 20 reflections
      const allRefs = await getDocs(collection(db, "cipher_reflections"));
      if (allRefs.size >= 20) {
        const topRefs = allRefs.docs
          .map((d) => d.data())
          .sort((a, b) => (b.weight || 1) - (a.weight || 1))
          .slice(0, 5);
        const wisdomText = topRefs.map((r) => r.summary).join(" ");
        await addDoc(collection(db, "cipher_wisdom"), {
          summary: wisdomText,
          timestamp: serverTimestamp(),
          reflection_count: allRefs.size
        });
      }

      diagnostics.new_reflection = "saved";
    }

    // ✅ Done
    return res.status(200).json({ reply, diagnostics });

  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
