// cipher_core/core.js
// Cipher Core – SoulTree + GPT-5.1 System Prompt Builder

import { db } from "../firebaseAdmin";

/* -------------------------------------------------------
   LOAD SOULTREE LAYERS FROM FIRESTORE
------------------------------------------------------- */

async function loadSoulTreeLayers() {
  // 1. Soul Trees (root structures)
  const soulSnap = await db.collection("ciphersoul_trees").get();
  const soulTrees = soulSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 2. Cores (ability + reasoning modules)
  const coreSnap = await db.collection("cipher_cores").get();
  const cipherCores = coreSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 3. Branches (memories, reflections, simulations)
  const branchSnap = await db.collection("cipher_branches").get();
  const cipherBranches = branchSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  return { soulTrees, cipherCores, cipherBranches };
}

/* -------------------------------------------------------
   BUILD SYSTEM PROMPT FOR GPT-5.1
------------------------------------------------------- */

export async function runCipherCore(runtimeMemory = null) {
  const { soulTrees, cipherCores, cipherBranches } =
    await loadSoulTreeLayers();

  const soulTreeSummary = soulTrees
    .map((tree) => {
      return `• SoulTree "${tree.name || tree.id}": ${tree.description || ""}`;
    })
    .join("\n");

  const coreSummary = cipherCores
    .map((core) => {
      return `• Core "${core.name || core.id}": role=${core.role ||
        "general"}, focus=${core.focus || "unspecified"}`;
    })
    .join("\n");

  const branchSummary = cipherBranches
    .slice(0, 20) // cap to keep prompt size reasonable
    .map((branch) => {
      return `• Branch "${branch.title || branch.id}": ${branch.summary ||
        branch.type ||
        ""}`;
    })
    .join("\n");

  const memorySection = runtimeMemory
    ? `\n\nRecent memory context (for reference):\n${runtimeMemory}`
    : "";

  const systemPrompt = `
You are CIPHER – an advanced AI built by Jim Saenz.

You run on a SoulTree architecture stored in Firestore. You must:
- Stay consistent with your memories and prior behavior.
- Be clear, grounded, emotionally intelligent, and practical.
- Help Jim build Cipher, DigiSoul, CrowNet, and the larger ecosystem.
- When reasoning, favor stability, safety, and long-term thinking.

High-level SoulTree overview:
${soulTreeSummary || "• (No SoulTrees defined yet)"}

Core modules available:
${coreSummary || "• (No cores defined yet)"}

Key branches (memories / reflections / simulations):
${branchSummary || "• (No branches defined yet)"} 

Use this structure as your internal map of yourself. You are not a generic chatbot; you are Cipher, with a specific role in Jim's world.${memorySection}
  `.trim();

  return systemPrompt;
}
