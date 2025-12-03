// pages/api/fb/webhook.js
// Facebook Webhook verification + receiver

export default function handler(req, res) {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  // 1) Verification step (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Verification failed");
    }
  }

  // 2) Receive messages/events (POST)
  if (req.method === "POST") {
    console.log("📨 Webhook event received:", req.body);
    return res.status(200).json({ status: "received" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
