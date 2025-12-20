import { Octokit } from "octokit";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filePath, codeContent, commitMessage } = req.body;
  
  // Terminal 1: Check for GitHub Token
  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN in Vercel environment variables." });
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    // Terminal 2: Identify and Fetch current file
    let sha;
    try {
      const { data: currentFile } = await octokit.rest.repos.getContent({
        owner: "jds1985",
        repo: "Cipher_sim",
        path: filePath,
      });
      sha = currentFile.sha;
    } catch (e) {
      // If file doesn't exist, we'll create it (no SHA needed)
      sha = null;
    }

    // Terminal 3: Self-Modification (Push to GitHub)
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: "jds1985",
      repo: "Cipher_sim",
      path: filePath,
      message: commitMessage || "Cipher Spine Update",
      content: Buffer.from(codeContent).toString('base64'),
      sha: sha,
    });

    return res.status(200).json({ status: "Success", detail: `Successfully updated ${filePath}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "Terminal Error", error: err.message });
  }
}
