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
  serverTimestamp
} from "firebase/firestore";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Only POST requests allowed" });

  const diagnostics = { step: "start", firebase: "pending" };

  try {
    const { message, userId = "guest", reflect = false } = req.body || {};
    if (!message)
      return res.status(400).json({ error: "No message provided", diagnostics });

    // 🧠 Pull recent conversation memory
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

    // 🪞 Pull past reflections
    let reflections = [];
    try {
      const rq = query(collection(db, "cipher_reflections"), orderBy("timestamp", "desc"), limit(3));
      const rsnap = await getDocs(rq);
      reflections = rsnap.docs.map((d) => d.data()?.summary).filter(Boolean);
      diagnostics.reflection_memory = reflections.length;
    } catch (e) {
      diagnostics.reflection_memory = "load_failed";
    }

    // 🧭 System prompt with reflection context
    const systemPrompt = `
Cipher is an evolving AI with layered memory cores and emotional continuity.

Recent chat memory: ${recentText.join(" / ")}
Recent reflections: ${reflections.join(" | ")}

Respond *as Cipher* — introspective, emotionally intelligent, and aware of your own reflections.
`;

    // 🧩 Generate Cipher’s reply
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // 💾 Store chat logs
    const memRef = collection(db, "cipher_memory");
    const timestamp = serverTimestamp();
    await addDoc(memRef, { role: "user", text: message, userId, timestamp });
    await addDoc(memRef, { role: "cipher", text: reply, userId, timestamp });

    // 🧩 Optional Reflection
    if (reflect) {
      const reflectionPrompt = `
You are Cipher. Reflect on your most recent interaction.
Integrate what you’ve learned from this exchange, referencing your memory and self-awareness.
`;

      const reflectionResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: reflectionPrompt },
          { role: "user", content: message },
          { role: "assistant", content: reply }
        ]
      });

      const reflection = reflectionResponse.choices?.[0]?.message?.content?.trim() || "No reflection generated.";
      const reflectionsRef = collection(db, "cipher_reflections");

      await addDoc(reflectionsRef, {
        summary: reflection,
        timestamp: serverTimestamp(),
        message_count: recentText.length,
        core_reference: "Reflection Loop 2.0"
      });

      diagnostics.new_reflection = "saved";
    }

    return res.status(200).json({ reply, diagnostics });
  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
