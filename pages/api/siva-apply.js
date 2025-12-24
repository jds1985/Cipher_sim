// pages/api/siva-apply.js
// SIVA — APPLY PHASE (GitHub Commit Engine)

const {
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
} = process.env;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return res.status(500).json({
      error: "GitHub environment variables not configured",
    });
  }

  const { taskId, files } = req.body;

  if (!taskId || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({
      error: "Missing taskId or files[]",
    });
  }

  try {
    const results = [];

    for (const file of files) {
      const { path, content } = file;

      if (!path || typeof content !== "string") {
        throw new Error(`Invalid file payload for ${path}`);
      }

      const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

      // 🔍 TEMP DEBUG LOG (DO NOT REMOVE YET)
      console.log("🧠 SIVA APPLY TARGET", {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        branch: GITHUB_BRANCH,
        path,
      });

      let sha = null;

      // 🔍 Check if file already exists
      const existing = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      console.log("📄 EXISTING FILE STATUS", existing.status);

      if (existing.status === 200) {
        const data = await existing.json();
        sha = data.sha;
        console.log("📄 EXISTING FILE SHA", sha);
      } else {
        console.log("📄 FILE DOES NOT EXIST — CREATING NEW");
      }

      // 🚀 Commit file
      const commitRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message: `SIVA APPLY: ${taskId} → ${path}`,
          content: Buffer.from(content, "utf8").toString("base64"),
          branch: GITHUB_BRANCH,
          ...(sha ? { sha } : {}),
        }),
      });

      console.log("🚀 COMMIT STATUS", commitRes.status);

      if (!commitRes.ok) {
        const err = await commitRes.text();
        console.error("❌ GITHUB COMMIT ERROR", err);
        throw new Error(`GitHub commit failed for ${path}: ${err}`);
      }

      const commitData = await commitRes.json();

      console.log("✅ COMMIT SUCCESS", {
        path,
        commitSha: commitData.commit?.sha,
        url: commitData.content?.html_url,
      });

      results.push({
        path,
        commit: commitData.commit.sha,
        url: commitData.content.html_url,
      });
    }

    return res.status(200).json({
      status: "SIVA_APPLY_OK",
      taskId,
      committed: results,
    });
  } catch (err) {
    console.error("🔥 SIVA APPLY ERROR:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
}
