import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractGeminiText(response) {
  const candidates = response?.candidates;
  if (!Array.isArray(candidates)) return null;

  for (const c of candidates) {
    const parts = c?.content?.parts;
    if (!Array.isArray(parts)) continue;

    let text = "";
    for (const p of parts) {
      if (typeof p?.text === "string") {
        text += p.text;
      }
    }

    if (text.trim()) return text.trim();
  }

  return null;
}

export async function geminiGenerate({
  systemPrompt = "",
  messages = [],
  userMessage,
  temperature = 0.6,
}) {
  console.log("✨ GEMINI GENERATE CALLED");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUAL_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  });

  const contents = [
    systemPrompt && {
      role: "user",
      parts: [{ text: `SYSTEM: ${systemPrompt}` }],
    },
    ...messages.map(m => ({
      role: "user",
      parts: [{ text: `${m.role.toUpperCase()}: ${m.content}` }],
    })),
    {
      role: "user",
      parts: [{ text: `USER: ${userMessage}` }],
    },
  ].filter(Boolean);

  const result = await model.generateContent({ contents });

  const text = extractGeminiText(result?.response);

  if (!text) {
    console.error("❌ Gemini returned empty or blocked output");
    console.error(
      "🔍 Raw response:",
      JSON.stringify(result?.response, null, 2).slice(0, 3000)
    );
    throw new Error("Gemini output blocked or empty");
  }

  return {
    reply: text,
    modelUsed: "gemini-1.5-flash",
  };
}
