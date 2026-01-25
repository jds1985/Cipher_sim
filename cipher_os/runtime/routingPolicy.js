// cipher_os/runtime/routingPolicy.js
// Phase 1: Always route to OpenAI (we’ll expand in Phase 2)

export function chooseModel({ userMessage }) {
  // In Phase 2 we add Claude/Gemini logic here.
  // For now, keep behavior identical but structured.
  return "openai";
}
