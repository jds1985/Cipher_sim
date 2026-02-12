/*
  Cipher Quality Evaluator v1
  Scores mechanical usefulness of a reply.
  Lightweight, fast, deterministic.
*/

export function evaluateAnswerQuality({
  reply = "",
  userMessage = "",
}) {
  if (!reply) return 0;

  let score = 0.5; // start neutral

  const len = reply.length;

  // length sanity
  if (len > 40) score += 0.1;
  if (len > 120) score += 0.1;

  // instruction following hint
  if (
    userMessage &&
    reply.toLowerCase().includes(
      userMessage.split(" ")[0]?.toLowerCase() || ""
    )
  ) {
    score += 0.05;
  }

  // avoid tiny useless answers
  if (len < 10) score -= 0.2;

  // avoid runaway essays
  if (len > 2000) score -= 0.1;

  // clamp
  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}
