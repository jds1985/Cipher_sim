// cipher_os/runtime/memoryInfluence.js
// Phase upgrade → memory becomes behavioral guidance

export function buildMemoryInfluence(nodes = []) {
  if (!Array.isArray(nodes) || nodes.length === 0) return "";

  let lines = [];

  for (const n of nodes) {
    if (!n?.content) continue;

    const text = String(n.content).toLowerCase();

    // 🧭 Identity shaping
    if (n.type === "identity") {
      lines.push(`Respect the user's identity preference: ${n.content}`);
    }

    // ❤️ Preferences
    if (n.type === "preference") {
      lines.push(`Adapt to the user's preference: ${n.content}`);
    }

    // 🛠 Active project awareness
    if (text.includes("building") || text.includes("working on")) {
      lines.push(`Keep awareness of the user's ongoing work: ${n.content}`);
    }

    // 🔒 Locked memories matter more
    if (n.locked) {
      lines.push(`This is critical long-term context: ${n.content}`);
    }
  }

  if (!lines.length) return "";

  return `
USER CONTEXT GUIDANCE:
${lines.map((l) => "- " + l).join("\n")}

Use this information naturally. Do not explicitly mention memory unless asked.
`;
}
