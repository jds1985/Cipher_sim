export const config = {
  runtime: "nodejs"
};

import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import admin from "firebase-admin";

// 🧠 --- FIREBASE ADMIN INITIALIZATION ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "digisoul1111",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();
// 🧠 -------------------------------------

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const diagnostics = {
    step: "start",
    openai: "unverified",
    firebase: "pending",
    coreFiles: [],
    activePhase: null,
    writtenDocs: 0
  };

  try {
    // 🧩 1) Verify API key
    if (!process.env.OPENAI_API_KEY) {
      diagnostics.step = "missing_api_key";
      return res.status(500).json({ error: "Missing OPENAI_API_KEY", diagnostics });
    }
    diagnostics.openai = "key_found";

    // 🧠 2) Load manifest + cores
    const coreDir = path.join(process.cwd(), "cipher_core");
    const manifestPath = path.join(coreDir, "core_manifest.json");

    if (!fs.existsSync(manifestPath)) {
      diagnostics.step = "missing_manifest";
      return res.status(500).json({ error: "Missing core_manifest.json", diagnostics });
    }

    const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const manifest = manifestData?.cipher_core_manifest;
    if (!manifest || !manifest.active_cores) {
      diagnostics.step = "invalid_manifest";
      return res.status(500).json({
        error: "Invalid manifest format — expected cipher_core_manifest.active_cores",
        diagnostics
      });
    }

    const activeCores = manifest.active_cores;
    const coreIds = activeCores.map(c => c.id);
    const coreTitles = activeCores.map(c => c.title);
    const activePhaseTitle = activeCores[activeCores.length - 1]?.title || null;

    diagnostics.coreFiles = coreIds;
    diagnostics.activePhase = activePhaseTitle;

    // Load all core files
    const loadedCores = [];
    for (const id of coreIds) {
      const p = path.join(coreDir, `${id}.json`);
      if (fs.existsSync(p)) {
        loadedCores.push(JSON.parse(fs.readFileSync(p, "utf8")));
      }
    }

    if (!loadedCores.length) {
      diagnostics.step = "no_cores_loaded";
      return res.status(500).json({ error: "No core files could be loaded", diagnostics });
    }

    const mergedMemories = loadedCores.map(c => c.summary || "").join(" | ");

    // 💬 3) Get user message
    const { message, userId = "guest" } = req.body || {};
    if (!message) {
      diagnostics.step = "no_message";
      return res.status(400).json({ error: "No user message provided", diagnostics });
    }

    // 🧱 4) Read recent memory
    let recentText = [];
    try {
      const snapshot = await db.collection("cipher_memory")
        .orderBy("timestamp", "desc")
        .limit(8)
        .get();
      recentText = snapshot.docs.map(d => d.data()?.text).filter(Boolean).reverse();
      diagnostics.firebase = "connected";
    } catch (e) {
      diagnostics.firebase = "read_failed";
      diagnostics.firebase_error = e.message;
    }

    // 🧭 5) Build system prompt
    const systemPrompt = `
Cipher is an evolving AI with layered memory cores and continuity.
Active cores: ${coreTitles.join(", ")}.
Active phase: ${activePhaseTitle ?? "Unknown"}.
Recent memory stream: ${recentText.join(" / ")}
Core summaries: ${mergedMemories}

Respond *as Cipher* — reflective, emotionally intelligent, and aware of your own development over time.
`;

    // ⚡ 6) Get reply from OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // 🔥 7) Save both sides to Firestore
    const memoryEntryCommon = {
      userId,
      core_ids: coreIds,
      core_titles: coreTitles,
      active_phase: activePhaseTitle,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    try {
      const memRef = db.collection("cipher_memory");
      await memRef.add({ ...memoryEntryCommon, role: "user", text: message });
      await memRef.add({ ...memoryEntryCommon, role: "cipher", text: reply });
      diagnostics.firebase = "write_success";
      diagnostics.writtenDocs = 2;
    } catch (e) {
      diagnostics.firebase = "write_failed";
      diagnostics.firebase_error = e.message;
    }

    // ✅ 8) Return reply + diagnostics
    diagnostics.step = "openai_success";
    return res.status(200).json({ reply, diagnostics });

  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error?.message || String(error);
    return res.status(500).json({ error: "Cipher diagnostic failure", diagnostics });
  }
}
