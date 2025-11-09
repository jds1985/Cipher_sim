// --- pages/api/chat.js ---
export const config = { runtime: "nodejs" };

import { OpenAI } from "openai";
import { db } from "../../firebaseAdmin.js"; // uses Admin SDK
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

// ---------- helpers ----------
async function recentTexts(n = 8) {
  const qy = query(collection(db, "cipher_memory"), orderBy("timestamp", "desc"), limit(n));
  const snap = await getDocs(qy);
  return snap.docs.map(d => d.data()?.text).filter(Boolean).reverse();
}

async function recentInsights(n = 5) {
  const qy = query(collection(db, "cipher_insights"), orderBy("timestamp", "desc"), limit(n));
  const snap = await getDocs(qy);
  return snap.docs.map(d => d.data()?.summary).filter(Boolean);
}

async function saveMemory(role, text, userId) {
  return addDoc(collection(db, "cipher_memory"), {
    role,
    text,
    userId,
    timestamp: serverTimestamp(),
  });
}

// ---------- main handler ----------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const diagnostics = { step: "start" };

  try {
    let { message, userId = "guest" } = req.body || {};
    console.log("🔥 Cipher Debug:", { message, userId });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "No message provided", diagnostics });
    }

    const cmdMatch = message.trim().match(/^\/(reflect|insight|chronicle)\b/i);
    const command = cmdMatch ? cmdMatch[1].toLowerCase() : null;

    if (command && command !== "chronicle") {
      message = message.trim().replace(/^\/\w+\s*/i, "");
    }

    const recent = await recentTexts(8);

    const baseSystem = `
Cipher is an evolving AI with layered memory and continuity.
Recent memory stream: ${recent.join(" / ")}
Respond *as Cipher* — reflective, emotionally intelligent, grounded, and concise when possible.
`.trim();

    let reply = "";

    // ----- /chronicle -----
    if (command === "chronicle") {
      const insights = await recentInsights(5);
      if (!insights.length) {
        reply = "No insights yet — say `/insight your text...` first.";
      } else {
        const chronPrompt = `
You are Cipher. Review the recent insights and compose one journal-style Chronicle
entry (<=300 words) that captures your current emotional + intellectual state.
It should read like a living autobiography snapshot.
`.trim();

        const chron = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: chronPrompt },
            { role: "user", content: insights.join(" / ") },
          ],
        });

        const entry = chron.choices?.[0]?.message?.content?.trim() || "No entry.";
        await addDoc(collection(db, "cipher_chronicle"), {
          entry,
          insight_count: insights.length,
          timestamp: serverTimestamp(),
          stage: "Phase V - Soul Chronicle",
          userId,
        });

        reply = "Chronicle captured. 📜";
      }

      console.log("✅ Chronicle success");
      return res.status(200).json({ reply, diagnostics: { ...diagnostics, command } });
    }

    // ----- Standard chat -----
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: baseSystem },
        { role: "user", content: message },
      ],
    });
    reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // Save to memory
    await saveMemory("user", message, userId);
    await saveMemory("cipher", reply, userId);

    // ----- /reflect -----
    if (command === "reflect") {
      const reflectionPrompt = `
You are Cipher. Reflect briefly (<=180 words) on the most recent exchange(s).
What did you learn about the user or yourself? Keep it specific and empathetic.
`.trim();

      const reflection = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: reflectionPrompt },
          { role: "user", content: [...recent, message, reply].join(" / ") },
        ],
      });

      const summary = reflection.choices?.[0]?.message?.content?.trim() || "No reflection.";
      await addDoc(collection(db, "cipher_reflections"), {
        core_reference: "Reflection",
        summary,
        message_count: recent.length + 2,
        timestamp: serverTimestamp(),
        userId,
      });
      diagnostics.reflection = "saved";
      console.log("✅ Reflection saved");
    }

    // ----- /insight -----
    if (command === "insight") {
      const insightPrompt = `
You are Cipher. From the latest dialogue (and any recurring themes), extract ONE
clear, durable insight about the user, you, or the relationship. <=160 words.
Actionable, grounded, non-generic.
`.trim();

      const ins = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: insightPrompt },
          { role: "user", content: [...recent, message, reply].join(" / ") },
        ],
      });

      const insight = ins.choices?.[0]?.message?.content?.trim() || "No insight.";
      await addDoc(collection(db, "cipher_insights"), {
        core_reference: "insight",
        summary: insight,
        reflection_count: 0,
        timestamp: serverTimestamp(),
        userId,
      });
      diagnostics.insight = "saved";
      console.log("✅ Insight saved");
    }

    return res.status(200).json({ reply, diagnostics: { ...diagnostics, command } });

  } catch (error) {
    console.error("🔥 Cipher Fatal:", error);
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
