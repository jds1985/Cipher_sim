// cipher_core/theme.js
// Cipher Core 10.0 — UI Theme Engine (Local, No External Dependencies)

const themes = {
  midnight_glass: {
    key: "midnight_glass",
    name: "Midnight Glass",
    tag: "Quiet • Focused • Sharp",
    description: "Dark crystalline interface with neon-blue edges and deep contrast.",
  },

  warm_orbit: {
    key: "warm_orbit",
    name: "Warm Orbit",
    tag: "Soft • Ambient • Grounded",
    description: "Amber orbital glow with warm highlights and relaxed emotional tone.",
  },

  sunset_amber: {
    key: "sunset_amber",
    name: "Sunset Amber",
    tag: "Calm • Warm",
    description: "Soft sunset gradient and gentle amber edges.",
  },
};

/**
 * Return a theme object by key.
 * Falls back to Midnight Glass if unknown.
 */
export function getThemeByKey(key = "midnight_glass") {
  return themes[key] || themes.midnight_glass;
}

export const availableThemes = Object.keys(themes);
