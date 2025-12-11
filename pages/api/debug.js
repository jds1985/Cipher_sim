export default function handler(req, res) {
  res.status(200).json({
    OPENAI: process.env.OPENAI_API_KEY ? true : false
  });
}
