// cipher_os/models/geminiAdapter.js
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
    generationConfig: { temperature },
  });

  // Gemini prefers structured content, not role-prefixed strings
  const contents = [
    ...(systemPrompt
      ? [{ role: "user", parts: [{ text: systemPrompt }] }]
      : []),
    ...messages.map((m) => ({
      role: "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const result = await model.generateContent({ contents });

  // 🔥 Canonical Gemini extraction
  const text =
    result?.response?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      ?.join("") || "";

  if (!text.trim()) {
    console.error("❌ Gemini returned empty response");
    console.error(
      JSON.stringify(result?.response, null, 2)
    );
    throw new Error("Gemini returned no usable text");
  }

  return {
    reply: text.trim(),
    modelUsed: "gemini-1.5-flash",
  };
}
