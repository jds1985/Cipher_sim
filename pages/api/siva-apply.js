// pages/api/siva-apply.js
// SIVA — APPLY PHASE (GitHub Commit Engine) — STEP 2 ENABLED

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
const MAX_FILE_BYTES = 800_000;

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
      `GitHub commit failed (${res.status}): ${
        res.data?.message || res.raw
      }`
    );
  }

  return {
    commitSha: res.data?.commit?.sha,
    url: res.data?.content?.html_url,
  };
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
      const content = file?.content;
      const mutation = file?.mutation;

      if (file?.mode && file.mode !== "FULL_CONTENT") {
        results.push({
          path: path || "(missing)",
          action,
          status: "SKIPPED",
          reason: `Mode ${file.mode} is not writable`,
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

      const existing = await getExistingFile(check.normalized);

      // 🔑 STEP 2: READ BEFORE MODIFY
      if (mutation === "PATCH_EXISTING" && existing.exists) {
        results.push({
          path: check.normalized,
          action,
          status: "READ_OK",
          note: "Existing content loaded for mutation",
        });
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
