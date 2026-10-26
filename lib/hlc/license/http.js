// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
export function sendJson(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.json(body);
}

export async function readRawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}
