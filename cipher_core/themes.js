// pages/api/themes.js
// Simple Theme Loader — NO FIREBASE ANYWHERE

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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

    return res.status(200).json({ themes });
  } catch (err) {
    console.error("themes API error:", err);
    return res.status(500).json({ error: "Failed to load themes" });
  }
}
