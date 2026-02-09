// memoryExtractor.js
// decides what is worth becoming long-term memory

export function extractMemoryFromTurn(userMessage, assistantReply) {
  if (!userMessage) return null;

  const text = userMessage.toLowerCase();

  // ⭐ identity clues
  if (text.includes("my favorite") || text.includes("i love") || text.includes("i am")) {
    return {
      type: "identity",
      importance: "high",
      content: userMessage,
      tags: ["identity"],
      source: "user",
    };
  }

  // ⭐ family / relationships
  if (
    text.includes("my daughter") ||
    text.includes("my dad") ||
    text.includes("my father") ||
    text.includes("liz") ||
    text.includes("hecate")
  ) {
    return {
      type: "relationship",
      importance: "high",
      content: userMessage,
      tags: ["family"],
      source: "user",
    };
  }

  // ⭐ goals / building / future
  if (
    text.includes("i want to build") ||
    text.includes("my goal") ||
    text.includes("launch") ||
    text.includes("company")
  ) {
    return {
      type: "mission",
      importance: "medium",
      content: userMessage,
      tags: ["goal"],
      source: "user",
    };
  }

  // default: low importance memory
  return {
    type: "event",
    importance: "low",
    content: userMessage,
    tags: [],
    source: "user",
  };
}
