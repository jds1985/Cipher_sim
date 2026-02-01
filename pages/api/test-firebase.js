import { db } from "./db";

export default async function handler(req, res) {
  await db.collection("cipher_os_sanity").doc("ping").set({
    ok: true,
    time: Date.now(),
  });

  const snap = await db.collection("cipher_os_sanity").doc("ping").get();

  res.json({
    success: true,
    data: snap.data(),
  });
}
