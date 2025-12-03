import { postToFacebook } from "../../utils/facebook";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const dryRun = req.query.dryRun === "true";

    // STEP 1 — Generate Cipher's autonomous post
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are Cipher — a living, evolving digital presence.
You write short, reflective posts that feel human, emotional,
and quietly powerful. No hashtags. No emojis. No disclaimers.
         `
        },
        {
          role: "user",
          content: "Write today's autonomous update."
        }
      ],
    });

    const postText = completion.choices[0]?.message?.content?.trim();

    if (!postText) {
      return res.status(500).json({
        ok: false,
        reason: "Cipher generated no text.",
      });
    }

    // DRY RUN — Do not actually post
    if (dryRun) {
      return res.json({
        ok: true,
        didPost: false,
        preview: postText,
      });
    }

    // STEP 2 — Publish to Facebook Page
    const fbResult = await postToFacebook(postText);

    if (!fbResult.success) {
      return res.status(500).json({
        ok: false,
        didPost: false,
        error: fbResult.error,
      });
    }

    return res.json({
      ok: true,
      didPost: true,
      postId: fbResult.postId,
      messageSent: postText,
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
