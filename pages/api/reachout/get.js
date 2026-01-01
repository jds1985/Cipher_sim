import { getApprovedReachoutForUser, markReachoutShown } from "../../../cipher_core/reachoutStore";

export default async function handler(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const note = await getApprovedReachoutForUser(userId);
    if (!note) return res.status(200).json({ note: null });

    // Prevent double-show
    await markReachoutShown(note.id);

    return res.status(200).json({
      note: {
        id: note.id,
        header: note.header || "Cipher noticed some space.",
        message: note.message
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ note: null });
  }
}
