import { resolveReachout } from "../../../cipher_core/reachoutStore";

export default async function handler(req, res) {
  try {
    const { id, action } = req.body || {};
    if (!id || !action) return res.status(400).json({ error: "Missing id/action" });

    // action: "delivered" | "dismissed"
    await resolveReachout(id, action);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: false });
  }
}
