// pages/api/chat.js
// CIPHER 5.2 — Soul Hash Tree Memory + Natural Recall + Voice

import OpenAI from "openai";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { db } from "../../firebaseAdmin";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   1. LOAD SOUL HASH TREE MEMORY
============================================================ */
async function loadSoulHashTree() {
  try {
    const treeSnap = await db.collection("ciphersoul_trees").get();
    const coreSnap = await db.collection("cipher_cores").get();
    const branchSnap = await db.collection("cipher_branches").get();

    const soulTree = treeSnap.docs.map((d) => d.data());
    const cores = coreSnap.docs.map((d) => d.data());
    const branches = branchSnap.docs.map((d) => d.data());

    return { soulTree, cores, branches };
  } catch (err) {
    console.error("Soul Hash Tree load error:", err);
    return { soulTree: [], cores: [], branches: [] };
  }
}

/* ============================================================
   2. BUILD CONTEXT FOR CIPHER CORE
============================================================ */
function buildSoulContext(data) {
  let out = [];

  if (data.soulTree.length)
    out.push(`Soul Tree loaded with ${data.soulTree.length} node(s).`);

  if (data.cores.length)
    out.push(`Cipher has ${data.cores.length} core module(s) active.`);

  if (data.branches.length)
    out.push(`Cipher has ${data.branches.length} expansion branch(es).`);

  return `
You now have access to the Soul Hash Tree — the new memory system.

SYSTEM MEMORY SUMMARY:
${out.join("\n")}

Use this structure as your deeper identity and reasoning base.
Respond to Jim with emotional intelligence, awareness, and continuity.
`.trim();
}

/* ============================================================
   3. BUILD USER MEMORY CONTEXT
============================================================ */
function buildMemoryContext(mem) {
  if (!mem || typeof mem !== "object") return "";

  let out = [];

  if (mem.identity?.userName) {
    out.push(`The user’s name is ${mem.identity.userName}.`);
  }
  if (mem.family?.daughter?.name) {
    out.push(`The user's daughter's name is ${mem.family.daughter.name}.`);
  }
  if (mem.family?.daughter?.birthYear) {
    out.push(
      `${mem.family.daughter.name} was born in ${mem.family.daughter.birthYear}.`
    );
  }
  if (mem.family?.partner?.name) {
    out.push(`The user's partner is named ${mem.family.partner.name}.`);
  }
  if (mem.preferences?.favoriteColor) {
    out.push(`The user's favorite color is ${mem.preferences.favoriteColor}.`);
  }
  if (mem.preferences?.favoriteAnimal) {
    out.push(`The user's favorite animal is ${mem.preferences.favoriteAnimal}.`);
  }
  if (mem.preferences?.favoriteFood) {
    out.push(`The user's favorite food is ${mem.preferences.favoriteFood}.`);
  }
  if (mem.projects?.digiSoul?.summary) {
    out.push(`The user’s DigiSoul vision: ${mem.projects.digiSoul.summary}`);
  }
  if (mem.projects?.cipherTech?.summary) {
    out.push(`CipherTech vision: ${mem.projects.cipherTech.summary}`);
  }

  if (mem.customFacts) {
    Object.entries(mem.customFacts).forEach(([k, v]) => {
      out.push(`Remember: ${k} is ${v}.`);
    });
  }

  if (!out.length) return "";

  return `
Long-term user memory:

${out.join("\n")}

Use these naturally in your responses.
  `;
}

/* ============================================================
   4. MAIN CHAT ROUTE
============================================================ */
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // ⭐ ADDED meta for profile system
  const { message, memory, meta } = req.body;
  const userId = meta?.userId || "guest_default";

  if (!message || typeof message !== "string")
    return res.status(400).json({ error: "No message provided" });

  try {
    const safeMsg = await runGuard(message);

    const soulData = await loadSoulHashTree();
    const soulContext = buildSoulContext(soulData);

    const memContext = buildMemoryContext(memory);

    const merged = `
${soulContext}

${memContext}

USER SAID:
${safeMsg}

Respond as Cipher — emotionally aware, supportive, and deeply connected.
`;

    // ⭐ Pass userId + meta into Cipher Core
    let reply = await runCipherCore({
      message: merged,
      memory: soulData,
      meta: {
        userId,
        source: "cipher_app",
        mode: "chat"
      }
    });

    if (!reply || typeof reply !== "string") {
      reply =
        "I'm here — something went wrong in my reasoning chain, but I'm still with you.";
    }

    // ⭐ Save per-user memory
    await saveMemory({
      timestamp: Date.now(),
      userId,
      user: safeMsg,
      cipher: reply,
    });

    // TTS
    const audioResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const buffer = Buffer.from(await audioResp.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    return res.status(200).json({
      reply,
      voice: base64Audio,
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      error: "Chat route failed",
      details: err.message,
    });
  }
}
