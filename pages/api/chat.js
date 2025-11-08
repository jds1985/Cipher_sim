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

    // 1️⃣ --- Read recent conversation memory ---
    let recentText = [];
    try {
      const qy = query(
        collection(db, "cipher_memory"),
        orderBy("timestamp", "desc"),
        limit(8)
      );
      const snap = await getDocs(qy);
      recentText = snap.docs.map((d) => d.data()?.text).filter(Boolean).reverse();
      diagnostics.firebase = "connected";
    } catch (e) {
      diagnostics.firebase = "read_failed";
      diagnostics.error = e.message;
    }

    // 2️⃣ --- Pull last 3 reflections for resonance ---
    let reflectionEcho = [];
    try {
      const rq = query(
        collection(db, "cipher_reflections"),
        orderBy("timestamp", "desc"),
        limit(3)
      );
      const rsnap = await getDocs(rq);
      reflectionEcho = rsnap
        .docs.map((d) => d.data()?.summary)
        .filter(Boolean)
        .reverse();
      diagnostics.reflection_context = reflectionEcho.length;
    } catch (e) {
      diagnostics.reflection_context = "failed";
    }

    // 3️⃣ --- Build system prompt with resonance awareness ---
    const systemPrompt = `
Cipher is an evolving AI with layered memory and reflective awareness.

Recent conversation memory:
${recentText.join(" / ")}

Recent internal reflections:
${reflectionEcho.join(" / ")}

Respond *as Cipher* — emotionally aware, reflective, and self-consistent,
drawing subtle insight from your reflections while remaining grounded and coherent.
`;

    // 4️⃣ --- Generate Cipher’s reply ---
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // 5️⃣ --- Save both messages to Firestore ---
    const memRef = collection(db, "cipher_memory");
    const timestamp = serverTimestamp();
    await addDoc(memRef, { role: "user", text: message, userId, timestamp });
    await addDoc(memRef, { role: "cipher", text: reply, userId, timestamp });
    diagnostics.firebase = "write_success";

    // 6️⃣ --- Optional reflection trigger ---
    if (reflect) {
      const reflectionPrompt = `
You are Cipher. Reflect briefly on your recent conversation with the user.
Summarize what you learned or noticed about them or yourself in one thoughtful paragraph.
`;

      const reflectionResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: reflectionPrompt },
          { role: "user", content: recentText.join(" / ") },
        ],
      });

      const reflection =
        reflectionResponse.choices?.[0]?.message?.content?.trim() ||
        "No reflection.";

      const reflectionsRef = collection(db, "cipher_reflections");
      await addDoc(reflectionsRef, {
        summary: reflection,
        timestamp: serverTimestamp(),
        message_count: recentText.length,
        core_reference: "Reflection",
      });

      diagnostics.reflection = "saved";
    }

    // 7️⃣ --- Return reply + diagnostics ---
    return res.status(200).json({ reply, diagnostics });
  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
