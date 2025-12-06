// logic/chatCore.js

export async function sendTextToCipher({ text, memory, voiceEnabled }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      memory,
      voice: voiceEnabled,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Chat error");
  }

  return {
    reply: data.reply || "",
    voice: data.voice || null,
  };
}
