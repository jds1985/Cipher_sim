import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
  });

  const fullPrompt = [
    systemPrompt && `SYSTEM: ${systemPrompt}`,
    ...messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
    `USER: ${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent(fullPrompt);

  // 🔧 ROBUST TEXT EXTRACTION (handles all Gemini shapes)
  let text = null;

  // Primary path (most common)
  if (typeof result?.response?.text === "function") {
    text = result.response.text();
  }

  // Fallback: candidates → content → parts
  if (!text) {
    const candidate = result?.response?.candidates?.[0];
    if (candidate?.content?.parts?.length) {
      text = candidate.content.parts
        .map((p) => p.text)
        .filter(Boolean)
        .join("\n");
    }
  }

  // Final fallback (rare but real)
  if (!text && result?.response?.output_text) {
    text = result.response.output_text;
  }

  if (!text || !text.trim()) {
    console.error("❌ Gemini returned no usable text");
    console.error(
      "🧠 Gemini raw response:",
      JSON.stringify(result?.response, null, 2)
    );
    throw new Error("Gemini returned no usable response");
  }

  console.log("🧠 Gemini reply length:", text.length);

  return {
    reply: text.trim(),
    modelUsed: "gemini-1.5-flash",
  };
}
