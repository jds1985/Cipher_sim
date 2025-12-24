export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  return res.status(200).json({
    status: "TERMINAL_ONLINE"
  });
}
