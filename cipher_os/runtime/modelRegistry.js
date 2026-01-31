// cipher_os/runtime/modelRegistry.js

export const MODEL_REGISTRY = {
  openai: {
    id: "openai",
    enabled: true,
    strengths: ["persona", "voice", "continuity"],
    defaultModel: "gpt-4o-mini",
  },
  anthropic: {
    id: "anthropic",
    enabled: true,
    strengths: ["reasoning", "code", "architecture"],
    defaultModel: "claude-3.5-sonnet",
  },
  gemini: {
    id: "gemini",
    enabled: true,
    strengths: ["long_context", "documents", "search"],
    defaultModel: "gemini-1.5",
  },
};
