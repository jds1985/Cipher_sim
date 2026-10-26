// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
export function sendJson(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.json(body);
}

export async function readRawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}
