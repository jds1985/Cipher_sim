// cipher_core/themes.js
// Local theme library – NOT an API

const themes = [
  {
    key: "midnight_glass",
    name: "Midnight Glass",
    tag: "Sleek • Minimal",
    description:
      "Dark glass panels with subtle cyan accents for deep work sessions.",
  },
  {
    key: "sunset_amber",
    name: "Sunset Amber",
    tag: "Warm • Cozy",
    description:
      "Amber glow gradients perfect for relaxed thinking and calm focus.",
  },
];

export function getThemeByKey(key) {
  return themes.find((t) => t.key === key) || themes[0];
}
