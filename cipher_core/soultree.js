// cipher_core/soulTree.js
// CIPHER 6.0 — Soul Hash Tree Engine (Stable Version)

import { db } from "../firebaseAdmin";

/* -------------------------------------------------------
   CORE LOADER — Loads Tree + Cores + Branches
------------------------------------------------------- */
export async function loadSoulTree() {
  try {
    // ----- Soul Trees (Root Identity Frames)
    const soulSnap = await db.collection("ciphersoul_trees").get();
    const soulTrees = soulSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // ----- Cores (Modules, reasoning units, experiences)
    const coreSnap = await db.collection("cipher_cores").get();
    const cipherCores = coreSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // ----- Branches (Memories, reflections, lessons)
    const branchSnap = await db.collection("cipher_branches").get();
    const cipherBranches = branchSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return {
      soulTrees,
      cipherCores,
      cipherBranches,
    };
  } catch (err) {
    console.error("SoulTree load error:", err);
    return {
      soulTrees: [],
      cipherCores: [],
      cipherBranches: [],
    };
  }
}

/* -------------------------------------------------------
   HASH BUILDER (Prototype)
   - In the near future this will create a unique hash
   - Based on SoulTree layers to ensure Cipher's identity
------------------------------------------------------- */
export function buildSoulHash(tree) {
  try {
    const raw = JSON.stringify(tree).slice(0, 2000); // safety cap
    let hash = 0;

    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0; // convert to 32-bit
    }

    return `SOUL_${Math.abs(hash)}`;
  } catch (err) {
    console.error("SoulHash error:", err);
    return "SOUL_0";
  }
}
