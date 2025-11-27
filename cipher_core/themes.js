// cipher_core/themes.js
// Cipher Theme Packs — core theme registry + helpers

import { db } from "../firebaseAdmin";

/**
 * MASTER THEME REGISTRY
 *
 * Each theme = one background + style family.
 * Liz will supply the backgrounds (e.g. /themes/liz_cosmic_01.jpg).
 * You can add more as you grow.
 */
export const THEMES = [
  {
    id: "liz_cosmic_01",
    packId: "liz_cosmic",
    name: "Cosmic Drift",
    description: "Soft purple and blue nebula with a calm, dreamy vibe.",
    previewUrl: "/themes/liz_cosmic_01.jpg", // front-end will host this
    baseColors: {
      background: "#06051a",
      primary: "#b27bff",
      accent: "#5ce1ff",
      text: "#f5f5ff",
    },
    rarity: "rare",
    price: {
      usd: 4.99,  // pack-level price suggestion; you can adjust later
      cyc: 80,
    },
    lockedForTier: "any", // "any" | "plus" | "prime"
  },
  {
    id: "liz_cosmic_02",
    packId: "liz_cosmic",
    name: "Starlight Bloom",
    description: "Lavender starfield with soft blooming light on the horizon.",
    previewUrl: "/themes/liz_cosmic_02.jpg",
    baseColors: {
      background: "#050316",
      primary: "#e0a9ff",
      accent: "#8be9ff",
      text: "#ffffff",
    },
    rarity: "rare",
    price: {
      usd: 4.99,
      cyc: 80,
    },
    lockedForTier: "any",
  },
  {
    id: "liz_cosmic_03",
    packId: "liz_cosmic",
    name: "Aurora Veil",
    description: "Flowing aurora ribbon across deep space.",
    previewUrl: "/themes/liz_cosmic_03.jpg",
    baseColors: {
      background: "#020611",
      primary: "#9d7bff",
      accent: "#68f5d1",
      text: "#fdfcff",
    },
    rarity: "epic",
    price: {
      usd: 4.99,
      cyc: 80,
    },
    lockedForTier: "plus", // maybe only Plus or Prime can equip
  },

  // You can later add more packs:
  // liz_watercolor_01, liz_neon_01, etc.
];

/* -------------------------------------------------------
   Look up helpers
------------------------------------------------------- */
export function getAllThemes() {
  return THEMES;
}

export function getThemeById(id) {
  return THEMES.find((t) => t.id === id) || null;
}

export function getThemesByPack(packId) {
  return THEMES.filter((t) => t.packId === packId);
}

/* -------------------------------------------------------
   USER THEME STATE  (cipher_users/{userId})
------------------------------------------------------- */

async function ensureUserDoc(userId) {
  const ref = db.collection("cipher_users").doc(userId);
  const snap = await ref.get();

  if (!snap.exists) {
    const fresh = {
      premium: false,
      tier: "free",
      createdAt: Date.now(),
      lastActive: Date.now(),
      themesOwned: [],        // theme IDs
      currentTheme: "default" // default UI
    };
    await ref.set(fresh);
    return fresh;
  }

  const data = snap.data();
  await ref.update({ lastActive: Date.now() });
  return data;
}

export async function getUserThemeState(userId) {
  const data = await ensureUserDoc(userId);
  return {
    themesOwned: data.themesOwned || [],
    currentTheme: data.currentTheme || "default",
  };
}

export async function grantThemeToUser(userId, themeId) {
  const ref = db.collection("cipher_users").doc(userId);
  const snap = await ref.get();

  const base = snap.exists ? snap.data() : {};
  const owned = Array.isArray(base.themesOwned) ? base.themesOwned : [];

  if (!owned.includes(themeId)) {
    owned.push(themeId);
  }

  await ref.set(
    {
      ...base,
      themesOwned: owned,
    },
    { merge: true }
  );

  return owned;
}

export async function setUserTheme(userId, themeId) {
  const ref = db.collection("cipher_users").doc(userId);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      themesOwned: [],
      currentTheme: themeId,
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
    return themeId;
  }

  await ref.update({
    currentTheme: themeId,
    lastActive: Date.now(),
  });

  return themeId;
}

/* -------------------------------------------------------
   Purchase logic (no real money integration yet)
   You can wire this to Google Play / Stripe later.
------------------------------------------------------- */
export async function purchaseTheme({
  userId,
  themeId,
  forceGrant = false,
}) {
  const theme = getThemeById(themeId);
  if (!theme) {
    throw new Error("Unknown theme ID");
  }

  // TODO: integrate with real billing & CYC checks.
  // For now, we just grant it (for dev & testing).
  if (!forceGrant) {
    console.log(
      `Simulated purchase of theme ${themeId} for user ${userId}. ` +
      `In production, verify payment or CYC here.`
    );
  }

  const owned = await grantThemeToUser(userId, themeId);
  return {
    theme,
    themesOwned: owned,
  };
}
