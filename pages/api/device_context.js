// pages/api/device_context.js
// Cipher Context Bridge – Snapshot + Save + Return

import { db } from "../../firebaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};
    const action = body.action || "snapshot";
    const userId = body.userId || "jim_default";

    const ref = db.collection("device_context").doc(userId);

    // --------------------------
    // 1) GENERATE SNAPSHOT
    // --------------------------
    if (action === "snapshot") {
      const snapshot = generateSnapshot(req);

      return res.status(200).json({
        ok: true,
        context: snapshot,
        updatedAt: new Date().toISOString(),
      });
    }

    // --------------------------
    // 2) SAVE SNAPSHOT
    // --------------------------
    if (action === "save") {
      const snapshot = body.snapshot || null;

      if (!snapshot) {
        return res
          .status(400)
          .json({ error: "Missing snapshot to save." });
      }

      await ref.set(
        {
          ...snapshot,
          savedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true, saved: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    console.error("DEVICE_CONTEXT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
      details: String(err),
    });
  }
}

// -------------------------------------------------------
// SNAPSHOT BUILDER (DEVICE CONTEXT BRIDGE)
// -------------------------------------------------------

function generateSnapshot(req) {
  const ua = req.headers["user-agent"] || "Unknown";

  const screenW = req.headers["x-screen-width"] || undefined;
  const screenH = req.headers["x-screen-height"] || undefined;

  return {
    summary: {
      modelGuess: guessModel(ua),
      os: guessOS(ua),
      browser: guessBrowser(ua),
      resolution: `${screenW} x ${screenH}`,
    },

    hardware: {
      threads: undefined, // browsers do not expose threads
      memoryEstimate: undefined, // limited on mobile
      battery: "Unknown", // mobiles block this in browsers
      touchSupport: "Yes",
    },

    network: {
      type: req.headers["x-network-type"] || "Unknown",
      effective: req.headers["x-network-effective"] || "?",
      downlink: req.headers["x-network-downlink"] || "?",
      online: req.headers["x-online"] || "Unknown",
    },

    permissions: {
      microphone: "Unknown",
      camera: "Unknown",
      notifications: "Unknown",
    },

    uplink: {
      status: "Inactive",
      confidence: "Unknown",
      lastSync: "Unknown",
    },

    rawUA: ua,
  };
}

// -------------------------------------------------------
// DEVICE GUESS HELPERS
// -------------------------------------------------------

function guessModel(ua) {
  if (ua.includes("SM-")) return "Samsung Galaxy (approx)";
  if (ua.includes("Pixel")) return "Google Pixel (approx)";
  if (ua.includes("iPhone")) return "iPhone (approx)";
  return "Unknown";
}

function guessOS(ua) {
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("iPhone")) return "iOS";
  return "Unknown";
}

function guessBrowser(ua) {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  return "Unknown";
}
