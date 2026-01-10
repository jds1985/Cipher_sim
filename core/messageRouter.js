import {
  canUseDecipher,
  recordDecipherUse,
  DECIPHER_COOLDOWN_MESSAGE,
} from "./decipherEngine";

export async function routeMessage({
  mode,
  message,
  history,
  fetchFn,
}) {
  if (mode === "decipher") {
    const gate = canUseDecipher();
    if (!gate.allowed) {
      return {
        role: "decipher",
        content: DECIPHER_COOLDOWN_MESSAGE,
        forceMode: "cipher",
      };
    }
  }

  const endpoint = mode === "decipher" ? "/api/decipher" : "/api/chat";

  const payload =
    mode === "decipher"
      ? { message, context: history }
      : { message, history };

  const res = await fetchFn(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return {
      role: mode === "decipher" ? "decipher" : "assistant",
      content:
        mode === "decipher"
          ? "Decipher didn’t answer."
          : "Cipher failed to respond.",
      forceMode: "cipher",
    };
  }

  const data = await res.json();

  if (mode === "decipher") {
    recordDecipherUse();
  }

  return {
    role: mode === "decipher" ? "decipher" : "assistant",
    content: String(data.reply || "…"),
    forceMode: "cipher",
  };
}
