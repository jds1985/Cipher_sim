export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: "Hello Jim, Cipher voice channel operational.",
        format: "mp3",
      }),
    });

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    res.status(200).json({ audio: base64Audio });
  } catch (err) {
    console.error("Voice test error:", err);
    res.status(500).json({ error: err.message });
  }
}
