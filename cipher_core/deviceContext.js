// cipher_core/deviceContext.js
// Cipher 10.0 – Device Context Loader

import { db } from "../firebaseAdmin";

export async function loadDeviceContext(userId = "jim_default") {
  try {
    const snap = await db
      .collection("cipher_device_context")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return {
        device: "unknown",
        battery: null,
        orientation: null,
        lastSeen: null,
      };
    }

    const data = snap.docs[0].data();

    return {
      device: data.device || "unknown",
      battery: data.battery ?? null,
      orientation: data.orientation ?? null,
      lastSeen: data.createdAt || null,
    };
  } catch (err) {
    console.error("loadDeviceContext error:", err);
    return {
      device: "unknown",
      battery: null,
      orientation: null,
      lastSeen: null,
    };
  }
}
