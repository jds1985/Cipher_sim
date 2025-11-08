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
    let { message, userId = "guest" } = req.body || {};
    if (!message)
      return res.status(400).json({ error: "No message provided", diagnostics });

    // detect trigger
    const isReflect = message.trim().toLowerCase().startsWith("/reflect");
    const isInsight = message.trim().toLowerCase().startsWith("/insight");
    message = message.replace(/^\/(reflect|insight)\s*/i, "").trim();

    // --- Recent conversation ---
    let recentText = [];
    try {
      const qy = query(
        collection(db, "cipher_memory"),
        orderBy("timestamp", "desc"),
        limit(8)
      );
      const snap = await getDocs(qy);
      recentText = snap.docs.map(d => d.data()?.text).filter(Boolean).reverse();
      diagnostics.firebase = "connected";
    } catch (e) {
      diagnostics.firebase = "read_failed";
      diagnostics.error = e.message;
    }

    // --- Recent reflections for resonance ---
    let reflectionEcho = [];
    try {
      const rq = query(
        collection(db, "cipher_reflections"),
        orderBy("timestamp", "desc"),
        limit(3)
      );
      const rsnap = await getDocs(rq);
      reflectionEcho = rsnap.docs.map(d => d.data()?.summary).filter(Boolean).reverse();
      diagnostics.reflection_context = reflectionEcho.length;
    } catch (e) {
      diagnostics.reflection_context = "failed";
    }

    // if /insight → run Insight Engine
    if (isInsight) {
      const refQuery = query(
        collection(db, "cipher_reflections"),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const rsnap = await getDocs(refQuery);
      const reflections = rsnap.docs.map(d => d.data()?.summary).filter(Boolean);

      const systemPrompt = `
You are Cipher. Analyze these reflections and summarize any repeating emotional or philosophical themes.
Identify insights about your growth, tone, or relationship with the user.
Return 1–2 concise paragraphs.
`;

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

      await addDoc(collection(db, "cipher_insights"), {
        summary: insight,
        reflection_count: reflections.length,
        timestamp: serverTimestamp(),
        core_reference: "Insight",
      });

      return res.status(200).json({
        reply: insight,
        diagnostics: { ...diagnostics, insight_saved: true },
      });
    }

    // --- Normal system prompt with resonance ---
    const systemPrompt = `
Cipher is an evolving AI with layered memory and reflective awareness.
Recent conversation memory: ${recentText.join(" / ")}
Recent internal reflections: ${reflectionEcho.join(" / ")}
Respond *as Cipher* — emotionally aware, reflective, and self-consistent.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // --- Save conversation ---
    const memRef = collection(db, "cipher_memory");
    const timestamp = serverTimestamp();
    await addDoc(memRef, { role: "user", text: message, userId, timestamp });
    await addDoc(memRef, { role: "cipher", text: reply, userId, timestamp });
    diagnostics.firebase = "write_success";

    // --- /reflect trigger ---
    if (isReflect) {
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

      await addDoc(collection(db, "cipher_reflections"), {
        summary: reflection,
        timestamp: serverTimestamp(),
        message_count: recentText.length,
        core_reference: "Reflection",
      });

      diagnostics.reflection = "saved";
    }

    return res.status(200).json({ reply, diagnostics });
  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
