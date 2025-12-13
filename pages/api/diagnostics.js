// pages/api/diagnostics.js
export default async function handler(req, res) {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),

      runtime: process.env.VERCEL_RUNTIME || "node",
      region: process.env.VERCEL_REGION || "local",
      nodeVersion: process.version,

      env: {
        OPENAI_API_KEY_PRESENT: !!process.env.OPENAI_API_KEY,
        OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY
          ? process.env.OPENAI_API_KEY.length
          : 0,
      },

      openai_sdk: (() => {
        try {
          const OpenAI = require("openai");
          const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "missing",
          });

          return {
            import_ok: true,
            has_chat: !!client.chat,
            has_chat_completions: !!client.chat?.completions,
            has_responses: !!client.responses,
            client_type: typeof client,
          };
        } catch (e) {
          return {
            import_ok: false,
            error: e.message,
          };
        }
      })(),

      platform: {
        fetch_exists: typeof fetch === "function",
        global_keys: Object.keys(globalThis).slice(0, 10),
      },
    };

    return res.status(200).json(diagnostics);
  } catch (err) {
    return res.status(500).json({
      error: "Diagnostics failed",
      message: err.message,
    });
  }
}
