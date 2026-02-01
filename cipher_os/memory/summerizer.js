// cipher_os/memory/summarizer.js
// Rolling summary compressor (keeps enduring facts only)

import { openaiGenerate } from "../models/openaiAdapter";

function formatRecent(recent = []) {
  return recent
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
}

export async function updateRollingSummary({
  previousSummary = "",
  recentMessages = [],
  signal,
}) {
  const prompt = `
You are Cipher OS Memory Compression.

Task:
Update the rolling long-term summary for Jim and Cipher.
Keep ONLY enduring facts:
- identity facts (names, preferences, constraints)
- active projects and goals
- decisions made
- stable plans
Do NOT include transient chat fluff.

Previous summary:
${previousSummary || "(none)"}

Recent messages:
${formatRecent(recentMessages)}

Output format:
Return ONLY the updated summary text, concise but complete.
`.trim();

  const out = await openaiGenerate({
    systemPrompt: "You compress memory into stable long-term summary.",
    messages: [],
    userMessage: prompt,
    temperature: 0.2,
    signal,
  });

  return out.reply;
}
