import fetch from "node-fetch";

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
} = process.env;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const { taskId, files } = req.body;

  if (!taskId || !Array.isArray(files)) {
    return res.status(400).json({ error: "INVALID_PAYLOAD" });
  }

  const results = [];

  for (const file of files) {
    const { path, content } = file;

    if (!path || typeof content !== "string") continue;

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

    // Check if file exists (to get SHA)
    let sha = null;
    const check = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (check.ok) {
      const existing = await check.json();
      sha = existing.sha;
    }

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Siva apply: ${taskId}`,
        content: Buffer.from(content).toString("base64"),
        branch: GITHUB_BRANCH,
        sha,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "GITHUB_WRITE_FAILED",
        details: data,
      });
    }

    results.push({ path, committed: true });
  }

  return res.status(200).json({
    status: "SIVA_APPLY_COMPLETE",
    taskId,
    results,
  });
}
