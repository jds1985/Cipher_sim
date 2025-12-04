// pages/api/fb_callback.js

export default async function handler(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Missing Facebook authorization code");
    }

    return res.status(200).send(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1>Facebook Login Successful</h1>
          <p>Your app received the code:</p>
          <code>${code}</code>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Callback error:", err);
    return res.status(500).send("Server error");
  }
}
