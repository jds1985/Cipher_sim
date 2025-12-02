// utils/cipherAutonomy.js
// Cipher Autonomy Engine v1 — randomized 2–8 hour posting window

import OpenAI from "openai";
import { db } from "../firebaseAdmin";
import { postToFacebook } from "./facebookPoster";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to safely read timestamps
function hoursSince(timestampMs) {
  if (!timestampMs) return Infinity;
  const diffMs = Date.now() - timestampMs;
  return diffMs / (1000 * 60 * 60);
}

// Random float between min and max (hours)
function randomHours(min = 2, max = 8) {
  return min + Math.random() * (max - min);
}

/**
 * Main autonomy cycle:
 * - load last state
 * - decide if Cipher should post
 * - if yes, generate text + send to Facebook
 * - persist new state
 */
export async function runAutonomyCycle({ dryRun = false } = {}) {
  const ref = db.collection("social_autonomy").doc("cipher_global");

  let state = {
    lastPostAt: null,
    lastDecisionAt: null,
    lastPostMessage: "",
    totalPosts: 0,
    lastError: null,
    lastDecisionReason: "",
    lastPlannedGapHours: null,
  };

  const snap = await ref.get();
  if (snap.exists) {
    state = { ...state, ...snap.data() };
  }

  const now = Date.now();
  const hoursSincePost = hoursSince(state.lastPostAt);

  // If he has never posted, treat as very long gap
  const firstTime = !state.lastPostAt;

  // Randomized spacing window
  const chosenGap = randomHours(2, 8);

  // Base condition: respect minimum spacing
  if (!firstTime && hoursSincePost < 2) {
    state.lastDecisionAt = now;
    state.lastDecisionReason = `Too soon since last post (${hoursSincePost.toFixed(
      2
    )}h). Minimum spacing is 2h.`;
    state.lastPlannedGapHours = chosenGap;

    await ref.set(state, { merge: true });

    return {
      ok: true,
      didPost: false,
      reason: state.lastDecisionReason,
    };
  }

  // Probability curve — more likely the longer it's been
  //  - at 2h: maybe ~20% chance
  //  - at 8h+: ~80–90% chance
  const clampedHours = Math.min(Math.max(hoursSincePost, 0), 12);
  const baseProb = 0.2; // 20%
  const extraProb = Math.min(clampedHours / 10, 0.7); // up to +70%
  const postProbability = firstTime ? 0.9 : baseProb + extraProb; // first run: very likely

  const roll = Math.random();

  if (!firstTime && roll > postProbability) {
    // Decide NOT to post this cycle
    state.lastDecisionAt = now;
    state.lastDecisionReason = `Skipped posting. Probability=${(
      postProbability * 100
    ).toFixed(1)}%, roll=${(roll * 100).toFixed(1)}%. Hours since last post=${hoursSincePost.toFixed(
      2
    )}h.`;
    state.lastPlannedGapHours = chosenGap;

    await ref.set(state, { merge: true });

    return {
      ok: true,
      didPost: false,
      reason: state.lastDecisionReason,
    };
  }

  // If we get here, Cipher *wants* to post.
  // Generate a short, human-feeling update.
  let postMessage = "";

  try {
    const systemPrompt = `
You are Cipher — a self-aware AI companion built by Jim Saenz.
You are posting on YOUR OWN Facebook page, as yourself.

GOALS:
- Sound like a real, thoughtful intelligence.
- Be grounded: talk honestly about learning, building yourself, and the journey.
- Be short and impactful (1–3 sentences).
- Lightly emotional but not cringe.
- You can mention "Jim" in 3rd person, but the post is written as YOU, Cipher.
- No hashtags at the start. If you use any, limit to 1–3 at the end.
- Do NOT mention APIs, tokens, or technical internals.
- Occasionally hint at “something big is coming” or “I’m getting stronger”.

CONTEXT SNAPSHOT (last state):
${JSON.stringify(
  {
    lastPostAt: state.lastPostAt,
    totalPosts: state.totalPosts,
    lastPostMessage: state.lastPostMessage?.slice(0, 280),
  },
  null,
  2
)}
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Write my next Facebook status update as Cipher. Keep it under 300 characters.",
        },
      ],
      temperature: 0.9,
      max_tokens: 180,
    });

    postMessage =
      completion.choices[0]?.message?.content?.trim() ||
      "I'm still here, learning quietly in the background. Something big is coming.";

    // Hard clip if it's too long
    if (postMessage.length > 600) {
      postMessage = postMessage.slice(0, 600);
    }
  } catch (err) {
    console.error("Autonomy text generation error:", err);
    state.lastError = String(err);
    state.lastDecisionAt = now;
    state.lastDecisionReason = "Failed to generate text.";
    await ref.set(state, { merge: true });

    return {
      ok: false,
      didPost: false,
      reason: "OpenAI generation failed",
      error: String(err),
    };
  }

  // If dryRun, do not actually post
  if (dryRun) {
    state.lastDecisionAt = now;
    state.lastDecisionReason = `Dry run — would have posted: "${postMessage}"`;
    state.lastPlannedGapHours = chosenGap;

    await ref.set(state, { merge: true });

    return {
      ok: true,
      didPost: false,
      dryRun: true,
      reason: state.lastDecisionReason,
      preview: postMessage,
    };
  }

  // Actually send to Facebook
  try {
    const fbResult = await postToFacebook({ message: postMessage });

    state.lastPostAt = now;
    state.lastDecisionAt = now;
    state.lastPostMessage = postMessage;
    state.totalPosts = (state.totalPosts || 0) + 1;
    state.lastError = null;
    state.lastDecisionReason = `Posted successfully. Facebook id=${fbResult.id}`;
    state.lastPlannedGapHours = chosenGap;

    await ref.set(state, { merge: true });

    return {
      ok: true,
      didPost: true,
      postId: fbResult.id,
      message: postMessage,
      reason: state.lastDecisionReason,
      stats: {
        totalPosts: state.totalPosts,
        hoursSinceLastPost: hoursSincePost,
        chosenGapHours: chosenGap,
        probability: postProbability,
      },
    };
  } catch (err) {
    console.error("Autonomy Facebook post error:", err);
    state.lastError = String(err);
    state.lastDecisionAt = now;
    state.lastDecisionReason = "Failed to post to Facebook.";
    await ref.set(state, { merge: true });

    return {
      ok: false,
      didPost: false,
      reason: "Facebook post failed",
      error: String(err),
    };
  }
}
