// cipher_os/models/geminiAdapter.js
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function geminiGenerate({
  systemPrompt = "",
  userMessage,
  temperature = 0.6,
}) {
  console.log("✨ GEMINI GENERATE CALLED");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature },
  });

  const prompt = [
    systemPrompt && `SYSTEM:\n${systemPrompt}`,
    `USER:\n${userMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await model.generateContent(prompt);

  const parts =
    result?.response?.candidates?.[0]?.content?.parts ?? [];

  const text = parts
    .map(p => p.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    console.error("❌ Gemini empty response");
    console.error(JSON.stringify(result?.response, null, 2));
    throw new Error("Gemini returned empty output");
  }

  return {
    reply: text,
    modelUsed: "gemini-1.5-flash",
  };
}
