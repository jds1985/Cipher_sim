// pages/api/diagnostic.js
// Cipher Diagnostic Spine — zero external calls

export default async function handler(req, res) {
  const report = {
    ok: true,
    timestamp: new Date().toISOString(),
    runtime: {
      node: process.version,
      platform: process.platform,
    },
    env: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    },
    openai: {
      imported: false,
      clientConstructed: false,
      clientType: null,
      clientKeys: [],
      error: null,
    },
  };

  try {
    const OpenAI = (await import("openai")).default;
    report.openai.imported = true;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "missing",
    });

    report.openai.clientConstructed = true;
    report.openai.clientType = typeof client;
    report.openai.clientKeys = Object.keys(client);

  } catch (err) {
    report.openai.error = {
      message: err.message,
      name: err.name,
      stack: err.stack,
    };
  }

  res.status(200).json(report);
}
