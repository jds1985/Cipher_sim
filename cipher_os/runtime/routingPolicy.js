// cipher_os/runtime/routingPolicy.js
// Real routing logic

export function chooseModel({ userMessage }) {
  const msg = userMessage.toLowerCase();

  // Claude = reasoning / engineering
  if (
    msg.includes("architecture") ||
    msg.includes("refactor") ||
    msg.includes("design") ||
    msg.includes("build") ||
    msg.includes("debug") ||
    msg.includes("code")
  ) {
    return "anthropic";
  }

  // Gemini = large context / docs
  if (
    msg.includes("document") ||
    msg.includes("analyze file") ||
    msg.includes("summarize") ||
    msg.length > 800
  ) {
    return "gemini";
  }

  // Default: OpenAI = persona continuity
  return "openai";
}
