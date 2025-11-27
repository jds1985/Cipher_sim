// cipher_core/profile.js
// Cipher Profile System — Anonymous User Accounts + Personalization

import { db } from "../firebaseAdmin";
import crypto from "crypto";

/* -------------------------------------------------------
   GENERATE ANONYMOUS USER ID
------------------------------------------------------- */
export function generateAnonUserId() {
  const rand = crypto.randomBytes(4).toString("hex");
  return `cy_usr_${rand}`;
}

/* -------------------------------------------------------
   PROFILE DEFAULT STRUCTURE
------------------------------------------------------- */
function defaultProfile(userId) {
  return {
    userId,
    createdAt: Date.now(),
    lastActive: Date.now(),

    // Monetization
    premium: false,
    tier: "free", // free | plus | prime
    cycBalance: 0,

    // Aesthetic
    themesOwned: [],
    currentTheme: "default",

    // Permissions
    allowVisionTraining: false,
    allowVoiceTraining: false,
    allowBehaviorTraining: false,

    // Personalization
    tone: "neutral", // neutral | warm | analytical | supportive
    depthLevel: "normal", // low | normal | deep
    reflectionSpeed: "standard", // slow | standard | fast

    // Identity Compass tie-in
    identityMode: "balanced", // balanced | logical | emotional | stoic

    // Expandable
    settings: {},
  };
}

/* -------------------------------------------------------
   LOAD OR CREATE PROFILE
------------------------------------------------------- */
export async function loadOrCreateProfile(userId) {
  try {
    const ref = db.collection("cipher_users").doc(userId);
    const snap = await ref.get();

    if (!snap.exists) {
      const base = defaultProfile(userId);
      await ref.set(base);
      return base;
    }

    const profile = snap.data();

    // Update last active timestamp
    await ref.update({ lastActive: Date.now() });

    return profile;
  } catch (err) {
    console.error("loadOrCreateProfile error:", err);
    return defaultProfile(userId);
  }
}

/* -------------------------------------------------------
   UPDATE PROFILE FIELDS
------------------------------------------------------- */
export async function updateProfile(userId, updates = {}) {
  try {
    const ref = db.collection("cipher_users").doc(userId);
    await ref.set(updates, { merge: true });
    return true;
  } catch (err) {
    console.error("updateProfile error:", err);
    return false;
  }
}

/* -------------------------------------------------------
   CIPHERCOIN OPERATIONS
------------------------------------------------------- */
export async function addCYC(userId, amount) {
  try {
    const ref = db.collection("cipher_users").doc(userId);
    const snap = await ref.get();
    const base = snap.data() || defaultProfile(userId);

    const newBalance = (base.cycBalance || 0) + amount;

    await ref.update({ cycBalance: newBalance });
    return newBalance;
  } catch (err) {
    console.error("addCYC error:", err);
    return null;
  }
}

export async function subtractCYC(userId, amount) {
  try {
    const ref = db.collection("cipher_users").doc(userId);
    const snap = await ref.get();
    const base = snap.data() || defaultProfile(userId);

    const current = base.cycBalance || 0;
    if (current < amount) return null;

    const newBalance = current - amount;
    await ref.update({ cycBalance: newBalance });

    return newBalance;
  } catch (err) {
    console.error("subtractCYC error:", err);
    return null;
  }
}
