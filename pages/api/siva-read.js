// pages/api/siva-read.js
// READ-ONLY FILE FETCH (NO COMMITS) — ADMIN GATED

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
  SIVA_ADMIN_KEY,
} = process.env;

function isAuthorized(req) {
  const k = req.headers["x-siva-admin"];
  return Boolean(SIVA_ADMIN_KEY && k && k === SIVA_ADMIN_KEY);
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(403).json({ status: "SIVA_UNAUTHORIZED" });
  }

  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing file path" });
  }

  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
      String(path)
    )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

    const gh = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (gh.status === 404) {
      return res.status(200).json({ exists: false, content: null });
    }

    const data = await gh.json();

    const content = Buffer.from(data.content || "", "base64").toString("utf8");

    return res.status(200).json({
      exists: true,
      content,
      sha: data.sha,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
