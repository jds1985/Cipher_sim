export default async function handler(req, res) {
  res.json({
    hasBase64: !!process.env.FIREBASE_ADMIN_BASE64,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  });
}
