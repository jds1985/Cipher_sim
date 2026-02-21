// pages/api/siva-map.js
// SIVA — REPO MAP (Read-Only Awareness Layer)

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
} = process.env;

const MAX_DEPTH = 3;
const IMPORTANT_DIRS = [
  "pages",
  "pages/api",
  "cipher_os",
  "models",
  "components",
  "lib",
];

function json(res, status, payload) {
  return res.status(status).json(payload);
}

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  return { ok: res.ok, status: res.status, data };
}

async function readDir(path = "", depth = 0) {
  if (depth > MAX_DEPTH) return [];

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    path
  )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await ghFetch(url);

  if (!res.ok || !Array.isArray(res.data)) {
    return [];
  }

  const items = [];

  for (const item of res.data) {
    if (item.type === "file") {
      items.push({
        type: "file",
        name: item.name,
        path: item.path,
      });
    }

    if (item.type === "dir") {
      items.push({
        type: "dir",
        name: item.name,
        path: item.path,
        children: await readDir(item.path, depth + 1),
      });
    }
  }

  return items;
}

/* ─────────────────────────────────────────────
   🔎 FLATTEN TREE → CREATE INDEX
───────────────────────────────────────────── */

function flattenTree(node, list = []) {
  if (!Array.isArray(node)) return list;

  for (const item of node) {
    if (item?.path) {
      list.push(item.path);
    }

    if (Array.isArray(item?.children)) {
      flattenTree(item.children, list);
    }
  }

  return list;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return json(res, 500, {
      status: "ENV_MISSING",
      error: "GitHub environment variables not configured",
    });
  }

  try {
    const map = {};
    const flatIndex = [];

    for (const dir of IMPORTANT_DIRS) {
      const tree = await readDir(dir);
      map[dir] = tree;
      flattenTree(tree, flatIndex);
    }

    return json(res, 200, {
      status: "SIVA_MAP_OK",
      branch: GITHUB_BRANCH,
      depth: MAX_DEPTH,
      index: flatIndex,   // ← NEW
      map,
    });
  } catch (err) {
    return json(res, 500, {
      status: "SIVA_MAP_ERROR",
      error: err.message,
    });
  }
}
