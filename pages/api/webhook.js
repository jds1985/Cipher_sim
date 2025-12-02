// pages/api/fb/webhook.js
import { replyToComment } from "../../../lib/facebook";

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

// 1) Verification: called once when you set up the webhook URL
function handleVerify(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[FB] Webhook verified");
    return res.status(200).send(challenge);
  } else {
    console.warn("[FB] Webhook verification failed");
    return res.sendStatus(403);
  }
}

// 2) Incoming events: comments, messages, etc.
async function handleEvent(req, res) {
  const body = req.body;

  if (body.object !== "page") {
    return res.sendStatus(404);
  }

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        // New comment on a post
        if (
          change.field === "feed" &&
          change.value.item === "comment" &&
          change.value.verb === "add"
        ) {
          const commentId = change.value.comment_id;
          const message = change.value.message || "";
          console.log("[FB] New comment:", commentId, message);

          // TODO: call Cipher brain here to generate a smart reply
          const autoReply =
            "Hey, thanks for commenting! 🧠 Cipher is listening.";

          await replyToComment(commentId, autoReply);
        }
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("[FB] Error handling webhook event:", err);
    return res.sendStatus(500);
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return handleVerify(req, res);
  } else if (req.method === "POST") {
    return handleEvent(req, res);
  } else {
    return res.sendStatus(405);
  }
}
