// pages/api/siva-apply.js
// SIVA — APPLY PHASE (GitHub Commit Engine) — PATCH ENABLED (Step 2)

console.log("🔥 SIVA APPLY HIT");

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
} = process.env;

// --- Safety: block dangerous or irrelevant targets
const BLOCKED_PATH_PREFIXES = [
  ".git/",
  "node_modules/",
  ".next/",
  "out/",
  "dist/",
  "build/",
];

const BLOCKED_PATH_EXACT = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

const ALLOWLIST_PREFIXES = [];
const MAX_FILE_BYTES = 800_000; // ~0.8MB

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function isAllowedPath(path) {
  if (!path || typeof path !== "string") {
    return { ok: false, reason: "Missing path" };
  }

  const p = path.replace(/\\/g, "/").trim();

  if (p.startsWith("/") || p.includes("..")) {
    return { ok: false, reason: "Path traversal or absolute path not allowed" };
  }

  if (!/^[a-zA-Z0-9._\-\/]+$/.test(p)) {
    return { ok: false, reason: "Invalid characters in path" };
  }

  if (BLOCKED_PATH_EXACT.has(p)) {
    return { ok: false, reason: `Blocked file: ${p}` };
  }

  for (const prefix of BLOCKED_PATH_PREFIXES) {
    if (p.startsWith(prefix)) {
      return { ok: false, reason: `Blocked directory: ${prefix}` };
    }
  }

  if (ALLOWLIST_PREFIXES.length > 0) {
    const allowed = ALLOWLIST_PREFIXES.some((pre) => p.startsWith(pre));
    if (!allowed) {
      return { ok: false, reason: "Path not in allowlist" };
    }
  }

  return { ok: true, normalized: p };
}

function shouldApplyAction(action) {
  const a = (action || "").toUpperCase();
  return a === "CREATE" || a === "UPDATE" || a === "CREATE_OR_UPDATE";
}

async function ghFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  return { ok: res.ok, status: res.status, data, raw: text };
}

async function getExistingFile(path) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    path
  )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await ghFetch(url, { method: "GET" });

  if (res.status === 200 && res.data?.sha) {
    const content = res.data.content
      ? Buffer.from(res.data.content, "base64").toString("utf8")
      : null;

    return { exists: true, sha: res.data.sha, content };
  }

  if (res.status === 404) {
    return { exists: false, sha: null, content: null };
  }

  throw new Error(`GitHub read failed (${res.status}): ${res.raw}`);
}

async function putFile(path, content, sha, message) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    path
  )}`;

  const body = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await ghFetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `GitHub commit failed (${res.status}): ${res.data?.message || res.raw}`
    );
  }

  return {
    commitSha: res.data?.commit?.sha,
    url: res.data?.content?.html_url,
  };
}

// ─────────────────────────────────────────────
// 🧠 PATCH ENGINE (deterministic)
// patchOps: [{ op, match, insert, replace, once }]
// Supported ops: INSERT_AFTER, INSERT_BEFORE, REPLACE, APPEND, PREPEND
// ─────────────────────────────────────────────

function applyPatchOps(original, patchOps = []) {
  if (typeof original !== "string") throw new Error("No original content loaded");
  if (!Array.isArray(patchOps) || patchOps.length === 0) {
    throw new Error("Missing patchOps[]");
  }

  let content = original;
  let changed = false;
  const applied = [];

  const safeMaxOps = 20;
  if (patchOps.length > safeMaxOps) {
    throw new Error(`Too many patchOps (${patchOps.length}). Max ${safeMaxOps}.`);
  }

  for (const op of patchOps) {
    const kind = (op?.op || "").toUpperCase();

    if (kind === "FAIL_SAFE") {
      throw new Error(op?.reason || "Patch failed safe");
    }

    const once = op?.once !== false; // default true
    const match = op?.match;

    if (kind === "APPEND") {
      const insert = op?.insert ?? "";
      content = content + insert;
      changed = true;
      applied.push({ op: "APPEND" });
      continue;
    }

    if (kind === "PREPEND") {
      const insert = op?.insert ?? "";
      content = insert + content;
      changed = true;
      applied.push({ op: "PREPEND" });
      continue;
    }

    if (typeof match !== "string" || match.length === 0) {
      throw new Error(`Patch op ${kind} missing match string`);
    }

    const idx = content.indexOf(match);
    if (idx === -1) {
      throw new Error(`Patch match not found: ${match}`);
    }

    if (kind === "INSERT_AFTER") {
      const insert = op?.insert ?? "";
      const at = idx + match.length;
      content = content.slice(0, at) + insert + content.slice(at);
      changed = true;
      applied.push({ op: "INSERT_AFTER", match });
      if (!once) {
        // optional: could loop; staying conservative for now
      }
      continue;
    }

    if (kind === "INSERT_BEFORE") {
      const insert = op?.insert ?? "";
      content = content.slice(0, idx) + insert + content.slice(idx);
      changed = true;
      applied.push({ op: "INSERT_BEFORE", match });
      continue;
    }

    if (kind === "REPLACE") {
      const replace = op?.replace;
      if (typeof replace !== "string") {
        throw new Error("REPLACE op missing replace string");
      }
      content = content.replace(match, replace);
      changed = true;
      applied.push({ op: "REPLACE", match });
      continue;
    }

    throw new Error(`Unsupported patch op: ${kind}`);
  }

  return { content, changed, applied };
}

function diffSummary(a, b) {
  // lightweight summary (no external deps)
  const aLines = (a || "").split("\n").length;
  const bLines = (b || "").split("\n").length;
  const deltaLines = bLines - aLines;
  const deltaBytes = Buffer.byteLength(b || "", "utf8") - Buffer.byteLength(a || "", "utf8");
  return { aLines, bLines, deltaLines, deltaBytes };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return json(res, 500, {
      status: "ENV_MISSING",
      error: "GitHub environment variables not configured",
    });
  }

  const { taskId, files, dryRun = false, commitMessage } = req.body || {};

  if (!taskId || typeof taskId !== "string") {
    return json(res, 400, { status: "BAD_REQUEST", error: "Missing taskId" });
  }

  if (!Array.isArray(files) || files.length === 0) {
    return json(res, 400, { status: "BAD_REQUEST", error: "Missing files[]" });
  }

  const results = [];
  let committedCount = 0;

  try {
    for (const file of files) {
      const path = file?.path;
      const action = (file?.action || "CREATE_OR_UPDATE").toUpperCase();
      const mode = (file?.mode || "FULL_CONTENT").toUpperCase();
      const mutation = (file?.mutation || "").toUpperCase();

      // Writable modes: FULL_CONTENT, PATCH
      const writable = mode === "FULL_CONTENT" || mode === "PATCH";
      if (!writable) {
        results.push({
          path: path || "(missing)",
          action,
          status: "SKIPPED",
          reason: `Mode ${mode} is not writable`,
        });
        continue;
      }

      if (!shouldApplyAction(action)) {
        results.push({
          path: path || "(missing)",
          action,
          status: "SKIPPED",
          reason: "Not an apply action",
        });
        continue;
      }

      const check = isAllowedPath(path);
      if (!check.ok) {
        results.push({
          path: path || "(missing)",
          action,
          status: "BLOCKED",
          reason: check.reason,
        });
        continue;
      }

      const existing = await getExistingFile(check.normalized);

      // PATCH mode: read → mutate → commit
      if (mode === "PATCH" || mutation === "PATCH_EXISTING") {
        if (!existing.exists || typeof existing.content !== "string") {
          results.push({
            path: check.normalized,
            action,
            status: "FAILED",
            reason: "PATCH requested but file does not exist or could not be read",
          });
          continue;
        }

        const patchOps = file?.patchOps || [];

        const patched = applyPatchOps(existing.content, patchOps);
        const newContent = patched.content;

        const size = Buffer.byteLength(newContent, "utf8");
        if (size > MAX_FILE_BYTES) {
          results.push({
            path: check.normalized,
            action,
            status: "FAILED",
            reason: `Patched file too large (${size} bytes)`,
          });
          continue;
        }

        if (!patched.changed || newContent === existing.content) {
          results.push({
            path: check.normalized,
            action,
            status: "SKIPPED",
            reason: "Patch produced no changes",
          });
          continue;
        }

        const summary = diffSummary(existing.content, newContent);

        if (dryRun) {
          results.push({
            path: check.normalized,
            action,
            status: "DRY_RUN_OK",
            branch: GITHUB_BRANCH,
            patchApplied: patched.applied,
            diff: summary,
          });
          continue;
        }

        const msg =
          commitMessage?.trim() ||
          `SIVA PATCH: ${taskId} → ${check.normalized}`;

        const commit = await putFile(
          check.normalized,
          newContent,
          existing.sha,
          msg
        );

        committedCount++;

        results.push({
          path: check.normalized,
          action,
          status: "COMMITTED",
          commit: commit.commitSha,
          url: commit.url,
          branch: GITHUB_BRANCH,
          patchApplied: patched.applied,
          diff: summary,
        });

        continue;
      }

      // FULL_CONTENT mode: write as provided (your original behavior)
      const content = file?.content;

      if (typeof content !== "string") {
        results.push({
          path: check.normalized,
          action,
          status: "FAILED",
          reason: "Missing content string",
        });
        continue;
      }

      const size = Buffer.byteLength(content, "utf8");
      if (size > MAX_FILE_BYTES) {
        results.push({
          path: check.normalized,
          action,
          status: "FAILED",
          reason: `File too large (${size} bytes)`,
        });
        continue;
      }

      if (action === "UPDATE" && !existing.exists) {
        results.push({
          path: check.normalized,
          action,
          status: "FAILED",
          reason: "UPDATE requested but file does not exist",
        });
        continue;
      }

      if (action === "CREATE" && existing.exists) {
        results.push({
          path: check.normalized,
          action,
          status: "FAILED",
          reason: "CREATE requested but file already exists",
        });
        continue;
      }

      if (dryRun) {
        results.push({
          path: check.normalized,
          action,
          status: "DRY_RUN_OK",
          branch: GITHUB_BRANCH,
        });
        continue;
      }

      const msg =
        commitMessage?.trim() ||
        `SIVA APPLY: ${taskId} → ${check.normalized}`;

      const commit = await putFile(
        check.normalized,
        content,
        existing.sha,
        msg
      );

      committedCount++;

      results.push({
        path: check.normalized,
        action,
        status: "COMMITTED",
        commit: commit.commitSha,
        url: commit.url,
        branch: GITHUB_BRANCH,
      });
    }

    return json(res, 200, {
      status: "SIVA_APPLY_OK",
      taskId,
      committedCount,
      results,
    });
  } catch (err) {
    return json(res, 500, {
      status: "SIVA_APPLY_ERROR",
      taskId,
      error: err.message,
      committedCount,
      results,
    });
  }
}
