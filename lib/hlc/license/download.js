// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// /api/download  ->  signed, expiring, ONE-TIME link to the private production package.
//   GET  ?token=...  verifies the link and shows a "Download now" page. It does NOT use the link up,
//                    so email scanners that pre-open links cannot burn it.
//   POST token=...   verifies, marks the link as used (atomic SET NX in the KV store) and sends the file.
// Fails closed: without a KV store, a secret or a package location nothing is ever served.
import { createReadStream, statSync } from "node:fs";
import { basename } from "node:path";
import { DOWNLOAD_FILE_KEY, DOWNLOAD_TTL_SECONDS } from "./config.js";
import { createStore } from "./store.js";
import { verifyToken } from "./token.js";
import { purchaseOf } from "../../products.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function page(res, status, title, bodyHtml) {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex");
  res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} | Cipher CTS</title>
<style>body{margin:0;padding:24px;background:#070b14;color:#fff;font:20px/1.6 system-ui,Arial,sans-serif}main{max-width:640px;margin:8vh auto}h1{font-size:30px}
button,a.b{display:inline-block;background:#22d3ee;color:#04101a;border:0;border-radius:12px;padding:16px 26px;font:700 22px system-ui,Arial,sans-serif;cursor:pointer;text-decoration:none}
button:focus-visible,a:focus-visible{outline:4px solid #ffe14d;outline-offset:3px}a{color:#22d3ee}p{color:#e6edf7}</style></head>
<body><main><h1>${esc(title)}</h1>${bodyHtml}<p>Questions? <a href="mailto:team@ciphercts.com">team@ciphercts.com</a></p></main></body></html>`);
}

const REASONS = {
  expired: ["This link has expired", "<p>Download links are valid for 72 hours. Reply to your purchase email or write to us and we will send a new one.</p>"],
  used: ["This link was already used", "<p>Each download link works one time. If you did not finish downloading, write to us and we will send a new link.</p>"],
  invalid: ["This link is not valid", "<p>The link is incomplete or has been changed. Please use the exact link from your purchase email.</p>"],
  unavailable: ["Downloads are temporarily unavailable", "<p>Please try again later or contact us. Your link has not been used up.</p>"],
};
const fail = (res, status, kind) => page(res, status, REASONS[kind][0], REASONS[kind][1]);

export function createDownloadHandler(deps = {}) {
  const env = () => deps.env || process.env;
  const storeFor = () => (deps.store !== undefined ? deps.store : createStore(env(), deps.fetch || globalThis.fetch));
  const now = deps.now || (() => Math.floor(Date.now() / 1000));

  return async function downloadHandler(req, res) {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return page(res, 405, "Method not allowed", "<p>Use the link from your email.</p>");
    }
    const e = env();
    const token = req.method === "POST" ? (req.body && typeof req.body === "object" ? req.body.token : undefined) || req.query?.token : req.query?.token;

    const store = storeFor();
    if (!e.DOWNLOAD_LINK_SECRET || !store) {
      console.error("[hlc download] not configured (secret / KV store); refusing to serve");
      return fail(res, 503, "unavailable");
    }

    const v = verifyToken(token, e.DOWNLOAD_LINK_SECRET, now());
    if (!v.ok) return v.reason === "expired" ? fail(res, 410, "expired") : fail(res, 400, "invalid");
    if (v.payload.file !== DOWNLOAD_FILE_KEY) return fail(res, 400, "invalid");

    // The signed link names its product (tokens without one are HLC's, as before). Each product has its own package location.
    const cfg = purchaseOf(v.payload.prod === undefined ? "hlc" : String(v.payload.prod));
    if (!cfg) return fail(res, 400, "invalid");
    const target = e[cfg.packageUrlVar];
    if (!target) {
      console.error(`[${cfg.id} download] not configured (${cfg.packageUrlVar}); refusing to serve`);
      return fail(res, 503, "unavailable");
    }

    const usedKey = `${cfg.kv}:dl:${v.payload.jti}`;
    try {
      if (req.method === "GET") {
        if ((await store.get(usedKey)) != null) return fail(res, 410, "used");
        return page(
          res,
          200,
          cfg.id === "hlc" ? "Your HLC production package" : `Your ${cfg.name} package`,
          `<p>Your link is valid. It can be used <strong>once</strong>, so start the download only when you are ready to save the file.</p>
<form method="POST" action="/api/download"><input type="hidden" name="token" value="${esc(token)}"><button type="submit">Download now</button></form>`
        );
      }

      // POST: consume the link. SET NX is atomic, so two simultaneous clicks cannot both win.
      const ttl = DOWNLOAD_TTL_SECONDS + 24 * 3600;
      if (!(await store.setNX(usedKey, String(now()), ttl))) return fail(res, 410, "used");
    } catch (err) {
      console.error("[hlc download] store error:", err?.message);
      return fail(res, 503, "unavailable");
    }

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (/^https?:\/\//i.test(target)) {
      res.redirect(302, target); // a private / signed URL held only in the environment
      return;
    }
    // Private file on the server's disk (self-hosting). Never inside /public.
    const path = target.replace(/^file:\/\//, "");
    try {
      const st = statSync(path);
      res.status(200);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Length", String(st.size));
      res.setHeader("Content-Disposition", `attachment; filename="${basename(path).replace(/[^\w.\-]/g, "_")}"`);
      createReadStream(path).pipe(res);
    } catch (err) {
      console.error("[hlc download] package file unreadable:", err?.message);
      try {
        await store.del(usedKey); // the file was not delivered, so give the link back
      } catch {}
      fail(res, 503, "unavailable");
    }
  };
}
