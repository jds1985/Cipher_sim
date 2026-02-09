// cipher_os/runtime/memoryInfluence.js
// Turns memory gravity into system influence

export function buildMemoryInfluence(nodes = [], limit = 8) {
  if (!Array.isArray(nodes) || nodes.length === 0) return "";

  const top = [...nodes]
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, limit);

  const lines = top
    .map((n) => {
      if (!n?.content) return null;
      return `- ${String(n.content).trim()}`;
    })
    .filter(Boolean);

  if (!lines.length) return "";

  return `
Important long-term user context:
${lines.join("\n")}
`;
}
