// pages/api/siva-apply.js
// SIVA — APPLY PHASE (GitHub Commit Engine) — UPGRADED

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
  "package-lock.json", // optional (keep or remove)
  "yarn.lock",         // optional
  "pnpm-lock.yaml",    // optional
]);

// If you want to restrict apply to only certain folders, add allowlist here.
// Leave empty to allow all (minus blocked rules).
const ALLOWLIST_PREFIXES = [
  // "pages/",
  // "components/",
  // "cipher_core/",
];

// GitHub content API size limit for a single file content is effectively limited;
// we keep a conservative cap to avoid weird failures.
const MAX_FILE_BYTES = 800_000; // ~0.8 MB

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function isAllowedPath(path) {
  if (!path || typeof path !== "string") return { ok: false, reason: "Missing path" };

  // normalize slashes
  const p = path.replace(/\\/g, "/").trim();

  // block absolute paths and traversal
  if (p.startsWith("/") || p.includes("..")) {
    return { ok: false, reason: "Path traversal or absolute path is not allowed" };
  }

  // block weird characters
  if (!/^[a-zA-Z0-9._\-\/]+$/.test(p)) {
    return { ok: false, reason: "Path contains invalid characters" };
  }

  // block exact files
  if (BLOCKED_PATH_EXACT.has(p)) {
    return { ok: false, reason: `Blocked target: ${p}` };
  }

  // block prefixes
  for (const prefix of BLOCKED_PATH_PREFIXES) {
    if (p.startsWith(prefix)) {
      return { ok: false, reason: `Blocked directory: ${prefix}` };
    }
  }

  // optional allowlist
  if (ALLOWLIST_PREFIXES.length > 0) {
    const allowed = ALLOWLIST_PREFIXES.some((prefix) => p.startsWith(prefix));
    if (!allowed) return { ok: false, reason: "Path is not in allowlist" };
  }

  return { ok: true, normalized: p };
}

function shouldApplyAction(action) {
  const a = (action || "").toUpperCase();
  // Only these should produce commits
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
  } catch {
    // leave as text
  }

  return { ok: res.ok, status: res.status, data, raw: text };
}

async function getExistingSha(path) {
  // Important: include ref so we check the correct branch
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    path
  )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const existing = await ghFetch(apiUrl, { method: "GET" });

  if (existing.status === 200 && existing.data?.sha) {
    return { exists: true, sha: existing.data.sha };
  }

  if (existing.status === 404) {
    return { exists: false, sha: null };
  }

  // Other statuses mean permission/branch/API issues
  const msg =
    typeof existing.data === "object"
      ? existing.data?.message || existing.raw
      : existing.raw;

  throw new Error(`GitHub read failed (${existing.status}) for ${path}: ${msg}`);
}

async function putFile(path, content, sha, message) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    path
  )}`;

  const body = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  };

  const commitRes = await ghFetch(apiUrl, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!commitRes.ok) {
    const msg =
      typeof commitRes.data === "object"
        ? commitRes.data?.message || commitRes.raw
        : commitRes.raw;

    throw new Error(`GitHub commit failed (${commitRes.status}) for ${path}: ${msg}`);
  }

  return {
    commitSha: commitRes.data?.commit?.sha,
    url: commitRes.data?.content?.html_url,
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
      missing: {
        GITHUB_TOKEN: !GITHUB_TOKEN,
        GITHUB_OWNER: !GITHUB_OWNER,
        GITHUB_REPO: !GITHUB_REPO,
      },
    });
  }

  const { taskId, files, dryRun = false, commitMessage } = req.body || {};

  if (!taskId || typeof taskId !== "string") {
    return json(res, 400, { status: "BAD_REQUEST", error: "Missing taskId (string)" });
  }

  if (!Array.isArray(files) || files.length === 0) {
    return json(res, 400, { status: "BAD_REQUEST", error: "Missing files[] array" });
  }

  // Process sequentially (simpler + avoids GitHub secondary rate-limit spikes)
  const results = [];
  let committedCount = 0;

  try {
    for (const file of files) {
      const path = file?.path;
      const action = (file?.action || "CREATE_OR_UPDATE").toUpperCase();
      const content = file?.content;

      // Skip describe-only entries and anything that shouldn't apply
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

      const bytes = Buffer.byteLength(content, "utf8");
      if (bytes > MAX_FILE_BYTES) {
        results.push({
          path: check.normalized,
          action,
          status: "FAILED",
          reason: `File too large (${bytes} bytes). Max is ${MAX_FILE_BYTES}.`,
        });
        continue;
      }

      // For UPDATE, ensure it exists
      const existing = await getExistingSha(check.normalized);
      if (action === "UPDATE" && !existing.exists) {
        results.push({
          path: check.normalized,
          action,
          status: "FAILED",
          reason: "UPDATE requested but file does not exist",
        });
        continue;
      }

      // For CREATE, ensure it doesn't exist
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
          wouldUpdate: existing.exists,
          branch: GITHUB_BRANCH,
        });
        continue;
      }

      const msg =
        typeof commitMessage === "string" && commitMessage.trim()
          ? commitMessage.trim()
          : `SIVA APPLY: ${taskId} → ${check.normalized}`;

      const commitInfo = await putFile(
        check.normalized,
        content,
        existing.sha,
        msg
      );

      committedCount += 1;

      results.push({
        path: check.normalized,
        action,
        status: "COMMITTED",
        commit: commitInfo.commitSha,
        url: commitInfo.url,
        branch: GITHUB_BRANCH,
      });
    }

    return json(res, 200, {
      status: "SIVA_APPLY_OK",
      taskId,
      dryRun: !!dryRun,
      committedCount,
      results,
    });
  } catch (err) {
    // Return partial results too so it doesn't feel like "nothing happened"
    return json(res, 500, {
      status: "SIVA_APPLY_ERROR",
      taskId,
      error: err?.message || String(err),
      committedCount,
      results,
    });
  }
}
