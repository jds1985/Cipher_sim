// pages/api/chat.js
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    return res.status(200).json({
      reply: "API ALIVE — minimal handler reached successfully.",
      time: Date.now(),
      method: req.method,
    });
  } catch (err) {
    return res.status(200).json({
      reply: "API crashed unexpectedly",
      error: String(err),
    });
  }
}
