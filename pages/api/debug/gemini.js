export const runtime = "nodejs";

export default function handler(req, res) {
  res.json({
    GEMINI: Boolean(process.env.GEMINI_API_KEY),
  });
}
