// logic/visionCore.js

export async function sendImageToCipher({ base64Image, memory, voiceEnabled }) {
  const res = await fetch("/api/vision_chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: base64Image,
      memory,
      voice: voiceEnabled,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Vision error");
  }

  return {
    reply: data.reply || "",
    voice: data.voice || null,
  };
}
