export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, rating } = req.body;

  if (!provider) {
    return res.status(400).json({ error: "Missing provider" });
  }

  global.MODEL_RATINGS = global.MODEL_RATINGS || {};

  if (!global.MODEL_RATINGS[provider]) {
    global.MODEL_RATINGS[provider] = { up: 0, down: 0 };
  }

  if (rating === "up") global.MODEL_RATINGS[provider].up += 1;
  if (rating === "down") global.MODEL_RATINGS[provider].down += 1;

  return res.json({
    ok: true,
    ratings: global.MODEL_RATINGS[provider],
  });
}
