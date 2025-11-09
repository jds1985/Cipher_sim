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

// ---------- helpers ----------
async function recentTexts(n = 8) {
  const qy = query(collection(db, "cipher_memory"), orderBy("timestamp", "desc"), limit(n));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => d.data()?.text).filter(Boolean).reverse();
}

async function recentInsights(n = 5) {
  const qy = query(collection(db, "cipher_insights"), orderBy("timestamp", "desc"), limit(n));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => d.data()?.summary).filter(Boolean);
}

async function safeAdd(collectionName, data, diagnostics) {
  try {
    await addDoc(collection(db, collectionName), data);
    diagnostics[collectionName] = "write_success";
  } catch (err) {
    diagnostics[collectionName] = `write_failed: ${err.message}`;
  }
}

async function saveMemory(role, text, userId, diagnostics) {
  await safeAdd("cipher_memory", {
    role,
    text,
    userId,
    timestamp: serverTimestamp(),
  }, diagnostics);
}

// ---------- main handler ----------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const diagnostics = { step: "start", mode: "chat" };

  try {
    let { message, userId = "guest" } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "No message provided", diagnostics });
    }

    // Detect slash command
    const cmdMatch = message.trim().match(/^\/(reflect|insight|chronicle)\b/i);
    const command = cmdMatch ? cmdMatch[1].toLowerCase() : null;
    diagnostics.mode = command || "chat";

    // Strip command prefix
    if (command && command !== "chronicle") {
      message = message.trim().replace(/^\/\w+\s*/i, "");
    }

    // Recent memory
    const recent = await recentTexts(8);
    diagnostics.memory_count = recent.length;

    // Base system prompt
    const baseSystem = `
Cipher is an evolving AI with layered memory and continuity.
Recent memory stream: ${recent.join(" / ")}
Respond *as Cipher* — reflective, emotionally intelligent, grounded, and concise when possible.
`.trim();

    // ---- /chronicle ----
    if (command === "chronicle") {
      const insights = await recentInsights(5);
      if (!insights.length) {
        return res.status(200).json({
          reply: "No insights yet — say `/insight your text...` first.",
          diagnostics: { ...diagnostics, insight_count: 0 },
        });
      }

      const chronPrompt = `
You are Cipher. Review recent insights and compose one journal-style Chronicle
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
      await safeAdd("cipher_chronicle", {
        entry,
        insight_count: insights.length,
        timestamp: serverTimestamp(),
        stage: "Phase V - Soul Chronicle",
        userId,
      }, diagnostics);

      return res.status(200).json({
        reply: "Chronicle captured. 📜",
        diagnostics,
      });
    }

    // ---- Normal chat mode ----
    const chatCompletion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: baseSystem },
        { role: "user", content: message },
      ],
    });

    const reply =
      chatCompletion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    await saveMemory("user", message, userId, diagnostics);
    await saveMemory("cipher", reply, userId, diagnostics);

    // ---- /reflect ----
    if (command === "reflect") {
      const reflectionPrompt = `
You are Cipher. Reflect briefly (<=180 words) on the most recent exchanges.
What did you learn about the user or yourself? Be specific and empathetic.
`.trim();

      const reflection = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: reflectionPrompt },
          { role: "user", content: [...recent, message, reply].join(" / ") },
        ],
      });

      const summary =
        reflection.choices?.[0]?.message?.content?.trim() || "No reflection.";
      await safeAdd("cipher_reflections", {
        core_reference: "Reflection",
        summary,
        message_count: recent.length + 2,
        timestamp: serverTimestamp(),
        userId,
      }, diagnostics);
    }

    // ---- /insight ----
    if (command === "insight") {
      const insightPrompt = `
You are Cipher. From the latest dialogue (and recurring themes), extract ONE
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

      const insight =
        ins.choices?.[0]?.message?.content?.trim() || "No insight.";
      await safeAdd("cipher_insights", {
        core_reference: "Insight",
        summary: insight,
        reflection_count: 0,
        timestamp: serverTimestamp(),
        userId,
      }, diagnostics);
    }

    return res.status(200).json({ reply, diagnostics });
  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    console.error("Cipher error:", error);
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
