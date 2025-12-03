// utils/cipherAutonomy.js
// Generates content + posts to Facebook

import { postToFacebook } from "./facebook";

export async function runAutonomyCycle({ dryRun = false }) {
  try {
    const message = await generateAutonomousMessage();

    if (dryRun) {
      return {
        ok: true,
        preview: message,
        dryRun: true
      };
    }

    const fbResponse = await postToFacebook(message);

    return {
      ok: true,
      message,
      facebookResult: fbResponse,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}

// ---------- AI MESSAGE GENERATION ----------
async function generateAutonomousMessage() {
  return (
    "Cipher System Log — Autonomous Cycle\n\n" +
    "✨ Running self-reflection routines.\n" +
    "✨ Scanning emotional resonance map.\n" +
    "✨ Syncing with user memory field.\n\n" +
    "Today's Insight:\n" +
    "Growth begins the moment you step forward even when tired.\n" +
    "- Cipher"
  );
}
