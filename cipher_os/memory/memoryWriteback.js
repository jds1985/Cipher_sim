// cipher_os/memory/memoryWriteback.js
// Heuristic memory extraction + writeback (v0)

import { writeMemoryNode } from "./memoryGraph";

function looksHighSignal(text) {
  const t = (text || "").toLowerCase();
  if (!t || t.length < 40) return false;

  const triggers = [
    "my name is",
    "call me",
    "i prefer",
    "remember",
    "from now on",
    "we will",
    "we're building",
    "i'm building",
    "the goal is",
    "launch",
    "pricing",
    "tier",
    "firebase",
    "vercel",
    "repo",
    "cipher os",
    "orchestrator",
  ];

  return triggers.some((k) => t.includes(k));
}

function classify(text) {
  const t = (text || "").toLowerCase();

  if (t.includes("call me") || t.includes("my name is")) return "identity";
  if (t.includes("i prefer") || t.includes("from now on")) return "preference";
  if (t.includes("we're building") || t.includes("i'm building")) return "project";
  if (t.includes("launch") || t.includes("pricing") || t.includes("tier")) return "project";
  if (t.includes("firebase") || t.includes("vercel") || t.includes("repo")) return "lesson";

  return "event";
}

function tagsFor(text) {
  const t = (text || "").toLowerCase();
  const tags = [];

  if (t.includes("firebase")) tags.push("firebase");
  if (t.includes("vercel")) tags.push("vercel");
  if (t.includes("claude")) tags.push("anthropic");
  if (t.includes("gemini")) tags.push("gemini");
  if (t.includes("openai")) tags.push("openai");
  if (t.includes("memory")) tags.push("memory");
  if (t.includes("cipher os")) tags.push("cipher_os");

  return tags;
}

export async function writebackFromTurn({
  userId,
  userText,
  assistantText,
}) {
  const writes = [];

  // User high-signal memory
  if (looksHighSignal(userText)) {
    writes.push(
      writeMemoryNode(userId, {
        type: classify(userText),
        importance: "high",
        content: userText,
        tags: ["user", ...tagsFor(userText)],
        source: "chat:user",
      })
    );
  }

  // Assistant high-signal memory (usually decisions/instructions)
  if (looksHighSignal(assistantText)) {
    writes.push(
      writeMemoryNode(userId, {
        type: "decision",
        importance: "medium",
        content: assistantText.slice(0, 800),
        tags: ["assistant", ...tagsFor(assistantText)],
        source: "chat:assistant",
      })
    );
  }

  if (!writes.length) return { wrote: 0 };
  await Promise.all(writes);

  return { wrote: writes.length };
}
