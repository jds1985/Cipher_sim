// cipher_core/guard.js
// Lightweight text guard filter

export async function runGuard(input = "") {
  if (!input || typeof input !== "string") {
    return { flagged: true, reason: "Invalid message", cleaned: "" };
  }

  const cleaned = input.trim();

  // VERY basic filter — expands later if you want
  const blocked = ["kill", "suicide", "harm yourself"];

  for (const word of blocked) {
    if (cleaned.toLowerCase().includes(word)) {
      return {
        flagged: true,
        reason: `Blocked keyword detected: "${word}"`,
        cleaned: "",
      };
    }
  }

  return {
    flagged: false,
    cleaned,
  };
}
