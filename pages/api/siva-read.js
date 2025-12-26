// pages/api/siva-read.js
// READ-ONLY FILE FETCH (NO COMMITS)

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
} = process.env;

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing file path" });
  }

  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;

    const gh = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (gh.status === 404) {
      return res.status(200).json({ exists: false, content: null });
    }

    const data = await gh.json();

    const content = Buffer.from(data.content, "base64").toString("utf8");

    res.status(200).json({
      exists: true,
      content,
      sha: data.sha,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
