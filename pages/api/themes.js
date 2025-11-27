// pages/api/themes.js
// Theme API — list / buy / set current theme

import {
  getAllThemes,
  getUserThemeState,
  purchaseTheme,
  setUserTheme,
} from "../../cipher_core/themes";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, userId, themeId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    switch (action) {
      case "list": {
        const themes = getAllThemes();
        const state = await getUserThemeState(userId);
        return res.status(200).json({
          themes,
          themesOwned: state.themesOwned,
          currentTheme: state.currentTheme,
        });
      }

      case "buy": {
        if (!themeId) {
          return res.status(400).json({ error: "Missing themeId" });
        }

        // For now, this just grants the theme.
        // Later: verify payment / CYC before granting.
        const result = await purchaseTheme({ userId, themeId });
        const state = await getUserThemeState(userId);

        return res.status(200).json({
          success: true,
          theme: result.theme,
          themesOwned: state.themesOwned,
          currentTheme: state.currentTheme,
        });
      }

      case "set": {
        if (!themeId) {
          return res.status(400).json({ error: "Missing themeId" });
        }

        const state = await getUserThemeState(userId);

        if (
          themeId !== "default" &&
          !state.themesOwned.includes(themeId)
        ) {
          return res
            .status(403)
            .json({ error: "Theme not owned. Purchase it first." });
        }

        const current = await setUserTheme(userId, themeId);
        return res.status(200).json({
          success: true,
          currentTheme: current,
        });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    console.error("Theme API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
