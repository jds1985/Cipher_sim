// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Delivery email through the Resend REST API (plain fetch). Large, plain, high-contrast HTML + a text version.

export const TERMS_URL = "https://ciphercts.com/hlc/commercial-terms";
export const COPYRIGHT = "© 2026 Cipher CTS. All Rights Reserved.";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function buildEmail({ link, expiresAt }) {
  const when = new Date(expiresAt * 1000).toUTCString();
  const subject = "Your HLC Commercial Production License: secure download link";
  const text = [
    "Thank you for purchasing the HLC Commercial Production License from Cipher CTS.",
    "",
    "Your secure, one-time download link for the production package:",
    link,
    "",
    `This link works ONE time and expires on ${when}.`,
    "Please download the file right away and keep it somewhere safe.",
    "If the link stops working, reply to this email and we will send a new one.",
    "",
    "Your receipt and subscription are managed by Stripe (you also received a Stripe receipt by email).",
    "",
    `Your use of the engine is governed by the Cipher CTS Commercial License Terms: ${TERMS_URL}`,
    "",
    "Questions: team@ciphercts.com",
    COPYRIGHT,
  ].join("\n");
  const html = `<!doctype html><html lang="en"><body style="margin:0;padding:24px;background:#ffffff;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.6;">
<h1 style="font-size:28px;margin:0 0 16px;">Thank you for your purchase</h1>
<p>Your <strong>HLC Commercial Production License</strong> from Cipher CTS is active.</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#000000;color:#ffffff;padding:16px 24px;border-radius:8px;font-size:22px;font-weight:bold;text-decoration:none;">Open my secure download page</a></p>
<p>If the button does not work, copy this address into your browser:<br><span style="word-break:break-all;">${esc(link)}</span></p>
<p><strong>This link works one time</strong> and expires on ${esc(when)}. Please download the file right away and keep it somewhere safe. If the link stops working, reply to this email and we will send a new one.</p>
<p>Your receipt and subscription are managed by Stripe. You also receive a Stripe receipt by email.</p>
<p>Your use of the engine is governed by the <a href="${TERMS_URL}" style="color:#0000cc;">Cipher CTS Commercial License Terms</a>.</p>
<p>Questions: <a href="mailto:team@ciphercts.com" style="color:#0000cc;">team@ciphercts.com</a><br>${COPYRIGHT}</p>
</body></html>`;
  return { subject, html, text };
}

/** Sends through Resend. Throws on any failure so the webhook can answer 500 and let Stripe retry. */
export async function sendEmail({ to, subject, html, text, idempotencyKey }, env = process.env, fetchImpl = globalThis.fetch) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) throw new Error("Email is not configured (RESEND_API_KEY / FROM_EMAIL)");
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
  return true;
}
