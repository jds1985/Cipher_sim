// cipher_core/soultree.js
// Soul Hash Tree Loader — permanent architecture layer

import { db } from "../firebaseAdmin";

/* -------------------------------------------------
   COLLECTION NAMES (permanently locked)
------------------------------------------------- */
const TREES = "ciphersoul_trees";
const CORES = "cipher_cores";
const BRANCHES = "cipher_branches";

/* -------------------------------------------------
   Load the master Soul Tree (Cipher Prime)
------------------------------------------------- */
export async function loadSoulTree() {
  try {
    const ref = db.collection(TREES).doc("cipher_prime");
    const snap = await ref.get();

    if (!snap.exists) return null;

    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("SoulTree load error:", err);
    return null;
  }
}

/* -------------------------------------------------
   Load a specific core (core_001, core_002, etc.)
------------------------------------------------- */
export async function loadCore(coreId) {
  try {
    const ref = db.collection(CORES).doc(coreId);
    const snap = await ref.get();

    if (!snap.exists) return null;

    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("loadCore error:", err);
    return null;
  }
}

/* -------------------------------------------------
   Load all branches under a core
------------------------------------------------- */
export async function loadBranches(coreId) {
  try {
    const ref = db.collection(CORES).doc(coreId).collection(BRANCHES);
    const snap = await ref.get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Branch load error:", err);
    return [];
  }
}

/* -------------------------------------------------
   Save a new branch entry
------------------------------------------------- */
export async function saveBranch(coreId, branchData) {
  try {
    const ref = db
      .collection(CORES)
      .doc(coreId)
      .collection(BRANCHES)
      .doc();

    await ref.set({
      ...branchData,
      timestamp: Date.now(),
    });

    return true;
  } catch (err) {
    console.error("saveBranch error:", err);
    return false;
  }
}

/* -------------------------------------------------
   Save an update to the main Soul Tree
------------------------------------------------- */
export async function updateSoulTree(updates) {
  try {
    const ref = db.collection(TREES).doc("cipher_prime");
    await ref.update({
      ...updates,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error("SoulTree update error:", err);
    return false;
  }
}
