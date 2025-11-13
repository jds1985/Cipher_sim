export default function handler(req, res) {
  res.status(200).json({
    cipher: "online ✅",
    openai: process.env.OPENAI_API_KEY ? "loaded 🔐" : "missing ❌",
    firebase: process.env.FIREBASE_API_KEY ? "loaded 🔐" : "missing ❌",
  });
}
