// cipher_core/theme.js
// UI Themes for Cipher Core

const themes = {
  midnight_glass: {
    key: "midnight_glass",
    name: "Midnight Glass",
    tag: "Quiet. Focused. Sharp.",
    description: "Dark crystalline glass with cool neon blue edges.",
  },

  warm_orbit: {
    key: "warm_orbit",
    name: "Warm Orbit",
    tag: "Gentle gravity.",
    description: "Soft orbital colors, amber and red glow tones.",
  },
};

export function getThemeByKey(key) {
  return themes[key] || themes.midnight_glass;
}
