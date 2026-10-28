// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Delivery email through the Resend REST API (plain fetch). Large, plain, high-contrast HTML + a text version.

import { purchaseOf } from "../../products.js";

export const TERMS_URL = "https://ciphercts.com/hlc/commercial-terms";
export const COPYRIGHT = "© 2026 Cipher CTS. All Rights Reserved.";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Download button, shared by every product's email. Colors are sampled from the Hex Circuit "C" logo (public/icon-512.png):
// the blue (#2BB5F0) to green (#58E59F) of its gradient. Black text on that is 9:1 or better (WCAG AAA is 7:1).
// Bulletproof: a table cell with a solid bgcolor (fallback, and what Outlook shows), a gradient layered on top where
// supported, inline styles only, solid opaque colors, and a 2px border. No transparency, so Gmail dark mode has nothing
// to turn black-on-black.
export const BUTTON_TEXT = "Open my secure download page";
export const BUTTON_COLORS = { solid: "#3DC8C0", from: "#2BB5F0", to: "#58E59F", text: "#000000", border: "#0A4F66" };
const FALLBACK_LINK_STYLE = "color:#0000cc;font-size:22px;font-weight:bold;text-decoration:underline;word-break:break-all;";
const EMAIL_HEAD = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">';

function downloadButton(link) {
  const c = BUTTON_COLORS;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-collapse:separate;"><tr><td align="center" bgcolor="${c.solid}" style="background-color:${c.solid};background-image:linear-gradient(135deg,${c.from},${c.to});border:2px solid ${c.border};border-radius:12px;"><a href="${esc(link)}" target="_blank" style="display:inline-block;padding:18px 32px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.3;font-weight:bold;color:${c.text};text-decoration:none;border-radius:12px;">${BUTTON_TEXT}</a></td></tr></table>`;
}

export function buildEmail({ link, expiresAt, product = "hlc" }) {
  if (product !== "hlc") return buildOtherEmail({ link, expiresAt, product });
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
  const html = `<!doctype html><html lang="en"><head>${EMAIL_HEAD}</head><body style="margin:0;padding:24px;background:#ffffff;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.6;">
<h1 style="font-size:28px;margin:0 0 16px;">Thank you for your purchase</h1>
<p>Your <strong>HLC Commercial Production License</strong> from Cipher CTS is active.</p>
${downloadButton(link)}
<p>If the button does not work, copy this address into your browser:<br><a href="${esc(link)}" style="${FALLBACK_LINK_STYLE}">${esc(link)}</a></p>
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

// Every other product: same layout and same one-time/72-hour wording, no claims beyond "you bought it and here is the link".
// No terms line (those products have no terms page yet) and no subscription claim (the price may be one-time or recurring).
function buildOtherEmail({ link, expiresAt, product }) {
  const name = purchaseOf(product)?.name || "Cipher CTS";
  const when = new Date(expiresAt * 1000).toUTCString();
  const subject = `Your ${name} purchase: secure download link`;
  const text = [
    `Thank you for purchasing ${name} from Cipher CTS.`,
    "",
    "Your secure, one-time download link:",
    link,
    "",
    `This link works ONE time and expires on ${when}.`,
    "Please download the file right away and keep it somewhere safe.",
    "If the link stops working, reply to this email and we will send a new one.",
    "",
    "Your receipt is sent separately by Stripe.",
    "",
    "Questions: team@ciphercts.com",
    COPYRIGHT,
  ].join("\n");
  const html = `<!doctype html><html lang="en"><head>${EMAIL_HEAD}</head><body style="margin:0;padding:24px;background:#ffffff;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.6;">
<h1 style="font-size:28px;margin:0 0 16px;">Thank you for your purchase</h1>
<p>Your purchase of <strong>${esc(name)}</strong> from Cipher CTS is complete.</p>
${downloadButton(link)}
<p>If the button does not work, copy this address into your browser:<br><a href="${esc(link)}" style="${FALLBACK_LINK_STYLE}">${esc(link)}</a></p>
<p><strong>This link works one time</strong> and expires on ${esc(when)}. Please download the file right away and keep it somewhere safe. If the link stops working, reply to this email and we will send a new one.</p>
<p>Your receipt is sent separately by Stripe.</p>
<p>Questions: <a href="mailto:team@ciphercts.com" style="color:#0000cc;">team@ciphercts.com</a><br>${COPYRIGHT}</p>
</body></html>`;
  return { subject, html, text };
}
