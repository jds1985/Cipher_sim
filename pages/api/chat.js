// --- chat.js (mobile friendly Firestore fix) ---
export const config = { runtime: "nodejs" };

import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { db } from "../firebaseConfig.js";
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
  if (req.method !== "POST") return res.status(405).json({ message: "Only POST requests allowed" });

  const diagnostics = { step: "start", firebase: "pending" };

  try {
    const { message, userId = "guest" } = req.body || {};
    if (!message) return res.status(400).json({ error: "No message" });

    // try reading existing memory
    let recentText = [];
    try {
      const qy = query(collection(db, "cipher_memory"), orderBy("timestamp", "desc"), limit(8));
      const snap = await getDocs(qy);
      recentText = snap.docs.map(d => d.data()?.text).filter(Boolean).reverse();
      diagnostics.firebase = "connected";
    } catch (e) {
      diagnostics.firebase = "read_failed";
      diagnostics.error = e.message;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are Cipher." }, { role: "user", content: message }]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // --- manual timestamp fallback ---
    const now = new Date();
    const timestamp = serverTimestamp() || now;

    try {
      const memRef = collection(db, "cipher_memory");
      await addDoc(memRef, { role: "user", text: message, userId, timestamp });
      await addDoc(memRef, { role: "cipher", text: reply, userId, timestamp });
      diagnostics.firebase = "write_success";
    } catch (e) {
      diagnostics.firebase = "write_failed";
      diagnostics.error = e.message;
    }

    return res.status(200).json({ reply, diagnostics });
  } catch (error) {
    diagnostics.step = "catch";
    diagnostics.error_message = error?.message;
    return res.status(500).json({ error: "Cipher failure", diagnostics });
  }
}
