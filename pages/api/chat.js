export const runtime = "nodejs";
export const maxDuration = 60;

// CORE
import { runCipherCore } from "../../cipher_core/core.js";
import { buildOSContext } from "../../cipher_os/runtime/osContext.js";
import { runSovereignMind } from "../../cipher_os/runtime/orchestrator";

// TOKEN BANK
import {
  canSpend,
  spendTokens,
  getRemaining,
} from "../../cipher_os/billing/tokenBank.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const message = req.body?.message?.trim() || "Hello";
    const tier = (req.body?.tier || "free").toLowerCase();
    const userId = req.body?.userId || req.headers["x-user-id"] || null;

    const tokenUserId = userId || "guest";
    const estimatedCost = Math.ceil(message.length * 1.5);

    // 🔒 TOKEN CHECK
    if (!canSpend(tokenUserId, estimatedCost, tier)) {
      return res.status(402).json({
        error: "Token limit reached",
        remaining: getRemaining(tokenUserId, tier),
      });
    }

    // 🧠 BUILD CONTEXT
    const osContext = buildOSContext({
      requestId: Date.now().toString(),
      userId: tokenUserId,
      userMessage: message,
    });

    // 🧠 EXECUTIVE CORE
    const executivePacket = await runCipherCore(
      { history: [], nodes: [], summary: "" },
      { userMessage: message, returnPacket: true }
    );

    // 🤖 MAIN MODEL CALL
    const out = await runSovereignMind({
      osContext,
      executivePacket,
      roles: null, // normal mode (not ternary batch)
    });

    console.log("🧠 CHAT OUTPUT:", out);

    // 🛟 HARD FALLBACK (prevents silent failure forever)
    const reply =
      out?.reply ||
      out?.text ||
      "⚠️ Cipher processed your request but returned no output.";

    // 💰 TOKEN SPEND
    spendTokens(tokenUserId, estimatedCost, tier);

    return res.status(200).json({
      reply,
      model: "CIPHER_STANDARD",
      remainingTokens: getRemaining(tokenUserId, tier),
    });

  } catch (err) {
    console.error("❌ /api/chat error:", err);
    return res.status(500).json({
      error: err.message || "Chat failed",
    });
  }
}
