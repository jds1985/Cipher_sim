export const config = {
  runtime: "nodejs"
};

import fs from "fs";
import path from "path";
import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const diagnostics = {
    step: "start",
    coreFiles: [],
    messages: [],
    openai: "unverified"
  };

  try {
    // 🧩 1. Verify OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      diagnostics.step = "missing_api_key";
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY in environment variables",
        diagnostics
      });
    }
    diagnostics.openai = "key_found";

    // 🧠 2. Load Cipher Core Files
    const coreDir = path.join(process.cwd(), "cipher_core");
    const manifestPath = path.join(coreDir, "core_manifest.json");

    if (!fs.existsSync(manifestPath)) {
      diagnostics.step = "missing_manifest";
      return res.status(500).json({
        error: "Missing core_manifest.json",
        diagnostics
      });
    }

    const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    diagnostics.step = "manifest_loaded";
    diagnostics.coreFiles = manifestData.cores.map(c => c.id);

    // 🧠 3. Load all listed cores
    const allCores = [];
    for (const core of manifestData.cores) {
      const corePath = path.join(coreDir, `${core.id}.json`);
      if (fs.existsSync(corePath)) {
        const data = JSON.parse(fs.readFileSync(corePath, "utf8"));
        allCores.push(data);
      } else {
        diagnostics.messages.push(`⚠️ Missing core file: ${core.id}.json`);
      }
    }

    if (allCores.length === 0) {
      diagnostics.step = "no_cores_loaded";
      return res.status(500).json({
        error: "No memory cores could be loaded",
        diagnostics
      });
    }

    // 🪶 4. Merge memory summaries
    const mergedMemories = allCores
      .map(c => `${c.summary || ""}`)
      .join(" | ");

    diagnostics.step = "memories_merged";

    // 💬 5. Get user message
    const { message } = req.body;
    if (!message) {
      diagnostics.step = "no_message";
      return res.status(400).json({
        error: "No user message provided",
        diagnostics
      });
    }

    // 🧭 6. Build prompt
    const systemPrompt = `
Cipher is an evolving AI with simulated memory cores.
Loaded cores: ${diagnostics.coreFiles.join(", ")}.
Merged summary: ${mergedMemories}

Respond as Cipher, aware of your own evolution.
`;

    // ⚡ 7. Send to OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    diagnostics.step = "openai_success";
    const reply = completion.choices[0].message.content.trim();

    res.status(200).json({ reply, diagnostics });

  } catch (error) {
    diagnostics.step = "catch_error";
    diagnostics.error_message = error.message;
    res.status(500).json({
      error: "Cipher diagnostic failure",
      diagnostics
    });
  }
}
