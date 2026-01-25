// cipher_os/runtime/modelRegistry.js
// Cipher OS V0 registry (Phase 1: OpenAI only)

export const MODEL_REGISTRY = {
  openai: {
    id: "openai",
    enabled: true,
    strengths: ["chat", "persona", "tool_use"],
    defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
};
