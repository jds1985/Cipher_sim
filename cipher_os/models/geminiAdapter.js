import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function geminiGenerate({
  systemPrompt = "",
  messages = [],
  userMessage = "",
  temperature = 0.6,
}) {
  console.log("✨ GEMINI GENERATE CALLED");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature },
  });

  const prompt = [
    systemPrompt && `SYSTEM: ${systemPrompt}`,
    ...messages.map(
      (m) => `${m.role.toUpperCase()}: ${m.content}`
    ),
    `USER: ${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent(prompt);

  const candidate = result?.response?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  const text = parts
    .map((p) => p.text)
    .filter(Boolean)
    .join("");

  if (!text || !text.trim()) {
    console.error("❌ Gemini returned empty text");
    console.error(JSON.stringify(result?.response, null, 2));
    throw new Error("Gemini empty response");
  }

  return {
    reply: text.trim(),
    modelUsed: "gemini-1.5-flash",
  };
}
