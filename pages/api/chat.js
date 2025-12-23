export default async function handler(req, res) {
  return res.status(200).json({
    reply: "🔌 Cipher signal restored (test response)"
  });
}
