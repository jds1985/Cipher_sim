export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are Cipher. Calm, concise, intelligent.",
          },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      throw new Error("OpenAI request failed");
    }

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ?? "(no reply)";

    return res.status(200).json({ message: reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return res
      .status(500)
      .json({ message: "Cipher failed to respond" });
  }
}
