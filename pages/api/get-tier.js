export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const snapshot = await db
      .collection("cipher_users")
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {
      return res.json({
        tier: "free",
        tokenLimit: 1000000,
        tokensUsed: 0,
      });
    }

    const data = snapshot.docs[0].data();

    return res.json({
      tier: data.tier || "free",
      tokenLimit: data.tokenLimit || 1000000,
      tokensUsed: data.tokensUsed || 0,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
