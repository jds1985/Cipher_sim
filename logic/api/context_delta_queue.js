let queue = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    queue.push(req.body);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    if (queue.length === 0) {
      return res.status(200).json({ speak: false });
    }

    return res.status(200).json(queue.shift());
  }

  return res.status(405).json({ error: "Method not allowed" });
}