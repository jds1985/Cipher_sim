// cipher_core/loadMemoryPack.js
// Load Jim's User Memory Pack cleanly (keeps existing Firestore naming)

import { db } from "../firebaseAdmin";

export async function loadMemoryPack() {
  try {
    // keep the existing Firestore document name exactly as-is
    const ref = db.collection("cipher_branches").doc("user_memory_pack");
    const snap = await ref.get();

    if (!snap.exists) {
      console.warn("⚠ No user_memory_pack found in Firestore.");
      return { summary: "No memory pack found.", data: {} };
    }

    const data = snap.data() || {};

    // build a clean summary for Deep Mode
    let summary = `User Memory Pack Loaded:\n`;
    summary += `- User: ${data.userName || "Unknown"}\n`;
    summary += `- Role: ${data.userRole || "N/A"}\n`;
    summary += `- Goals: ${(data.mainGoals || []).join(", ")}\n`;
    summary += `- Traits: ${(data.coreTraits || []).join(", ")}\n`;

    return {
      summary,
      data,
    };
  } catch (err) {
    console.error("Memory Pack Load Error:", err);
    return { summary: "Error loading memory pack.", data: {} };
  }
}
