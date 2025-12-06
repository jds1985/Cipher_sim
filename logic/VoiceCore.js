// logic/voiceCore.js

export async function sendVoiceToCipher({ base64Audio, memory, voiceEnabled }) {
  const res = await fetch("/api/voice_chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio: base64Audio,
      memory,
      voice: voiceEnabled,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Voice error");
  }

  return {
    transcript: data.transcript || "",
    reply: data.reply || "",
    voice: data.voice || null,
  };
}
