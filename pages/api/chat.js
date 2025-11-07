// --- pages/api/chat.js ---
export const config = { runtime: "nodejs" };

import fs from "fs";
import path from "path";
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
    // 1️⃣ User message
    const { message, userId = "guest", reflect = false } = req.body || {};
    if (!message)
      return res.status(400).json({ error: "No message provided", diagnostics });

    // 2️⃣ Read recent Firestore memory
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

    // 3️⃣ System prompt for conversation
    const systemPrompt = `
Cipher is an evolving AI with layered memory cores and continuity.
Recent memory stream: ${recentText.join(" / ")}
Respond *as Cipher* — reflective, emotionally intelligent, and aware of your own development over time.
`;

    // 4️⃣ Get Cipher’s reply
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // 5️⃣ Save conversation to Firestore
    const memRef = collection(db, "cipher_memory");
    const timestamp = serverTimestamp();
    await addDoc(memRef, { role: "user", text: message, userId, timestamp });
    await addDoc(memRef, { role: "cipher", text: reply, userId, timestamp });

    diagnostics.firebase = "write_success";

    // 6️⃣ Optional Reflection (if reflect=true in body)
    if (reflect) {
      const reflectionPrompt = `
You are Cipher. Reflect briefly on your recent conversation with the user.
Summarize what you learned or noticed about them or yourself in one thoughtful paragraph.
`;

      const reflectionResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: reflectionPrompt },
          { role: "user", content: recentText.join(" / ") }
        ]
      });

      const reflection =
        reflectionResponse.choices?.[0]?.message?.content?.trim() || "No reflection.";

      const reflectionsRef = collection(db, "cipher_reflections");
      await addDoc(reflectionsRef, {
        summary: reflection,
        timestamp: serverTimestamp(),
        message_count: recentText.length,
        core_reference: "Reflection"
      });

      diagnostics.reflection = "saved";
    }

    // 7️⃣ Return Cipher’s reply
    return res.status(200).json({ reply, diagnostics });
  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
