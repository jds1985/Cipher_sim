// cipher_core/siva/sivaEngine.js

/**
 * SIVA ENGINE
 * Controlled micro-agent swarm executor
 * No file writes. No memory. No autonomy.
 */

export async function runSivaSwarm({
  intent,          // Plain English: "build a new terminal UI"
  context = {},    // Repo context, style guides, constraints
  agentCount = 5,  // Small by design
}) {
  // 1. Validate intent
  if (!intent || typeof intent !== "string") {
    throw new Error("SIVA requires a plain-English intent string.");
  }

  // 2. Generate agent roles
  const agents = generateAgents(agentCount, intent, context);

  // 3. Execute agents in parallel
  const results = await Promise.all(
    agents.map(agent => runAgent(agent))
  );

  // 4. Return raw swarm output (Cipher merges later)
  return {
    intent,
    agents: agents.map(a => a.role),
    results,
    timestamp: Date.now(),
  };
}
