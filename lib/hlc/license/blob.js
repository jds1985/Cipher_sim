// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Fresh, short-lived link to a file in a PRIVATE Vercel Blob store, made at the moment a buyer downloads.
// The package location is set as  blob:<pathname>  (e.g. blob:packages/hlc_edge_engine_v3_commercial.zip)
// and the server signs with BLOB_READ_WRITE_TOKEN, so no hand-made expiring link has to be refreshed.
export const BLOB_PREFIX = "blob:";
export const BLOB_LINK_SECONDS = 5 * 60;

export const isBlobTarget = (t) => typeof t === "string" && t.startsWith(BLOB_PREFIX);
export const blobPathOf = (t) => t.slice(BLOB_PREFIX.length).replace(/^\/+/, "");

export async function presignPrivateBlob(pathname, env = process.env, nowMs = Date.now()) {
  if (!env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  if (!pathname) throw new Error("empty blob pathname");
  const { issueSignedToken, presignUrl } = await import("@vercel/blob");
  const validUntil = nowMs + BLOB_LINK_SECONDS * 1000;
  const token = env.BLOB_READ_WRITE_TOKEN;
  const signed = await issueSignedToken({ pathname, operations: ["get"], validUntil, token });
  const { presignedUrl } = await presignUrl(signed, { operation: "get", pathname, validUntil, access: "private" });
  return presignedUrl;
}
