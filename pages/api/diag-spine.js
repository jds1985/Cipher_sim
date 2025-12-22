import { Octokit } from "@octokit/rest";

/**
 * DIAGNOSTIC SPINE — TERMINAL BACKEND v1.1
 * Supports:
 *  - WRITE_FILE (single-file writes)
 *  - FILESYSTEM (flatten repo structure)
 */

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// 🔴 CHANGE THESE ONLY IF YOUR REPO INFO IS DIFFERENT
const OWNER = "jds1985";
const REPO = "Cipher";
const BRANCH = "main";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { mode } = req.body;

    if (mode === "WRITE_FILE") {
      return await handleWriteFile(req, res);
    }

    if (mode === "FILESYSTEM") {
      return await handleFilesystem(req, res);
    }

    return res.status(400).json({ error: "INVALID_MODE" });
  } catch (err) {
    console.error("SPINE ERROR:", err);
    return res.status(500).json({ error: "SPINE_FAILURE" });
  }
}

/* =========================
   WRITE FILE (v1 behavior)
   ========================= */
async function handleWriteFile(req, res) {
  const { filePath, codeContent, commitMessage } = req.body;

  if (!filePath || !codeContent) {
    return res.status(400).json({ error: "MISSING_FILE_OR_CONTENT" });
  }

  let sha;
  try {
    const existing = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      ref: BRANCH,
    });
    sha = existing.data.sha;
  } catch (_) {
    sha = undefined; // file does not exist yet
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: filePath,
    message: commitMessage || "Update via Cipher Terminal",
    content: Buffer.from(codeContent).toString("base64"),
    sha,
    branch: BRANCH,
  });

  return res.status(200).json({ status: "WRITE_SUCCESS" });
}

/* =========================
   FILESYSTEM OPS (v1.1)
   ========================= */
async function handleFilesystem(req, res) {
  const { operation, sourceDir, commitMessage } = req.body;

  if (operation !== "flatten" || !sourceDir) {
    return res.status(400).json({ error: "INVALID_FILESYSTEM_OPERATION" });
  }

  // 1. Get current HEAD commit
  const { data: ref } = await octokit.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
  });

  const headSha = ref.object.sha;

  // 2. Get commit tree
  const { data: commit } = await octokit.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: headSha,
  });

  const baseTreeSha = commit.tree.sha;

  // 3. Get full tree recursively
  const { data: tree } = await octokit.git.getTree({
    owner: OWNER,
    repo: REPO,
    tree_sha: baseTreeSha,
    recursive: true,
  });

  const newTree = [];

  for (const item of tree.tree) {
    // Skip the source directory root itself
    if (item.path === sourceDir) continue;

    // Move items inside sourceDir up one level
    if (item.path.startsWith(`${sourceDir}/`)) {
      newTree.push({
        path: item.path.replace(`${sourceDir}/`, ""),
        mode: item.mode,
        type: item.type,
        sha: item.sha,
      });
    } else {
      // Keep everything else untouched
      newTree.push(item);
    }
  }

  // 4. Create new tree
  const { data: createdTree } = await octokit.git.createTree({
    owner: OWNER,
    repo: REPO,
    tree: newTree,
    base_tree: baseTreeSha,
  });

  // 5. Create commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message:
      commitMessage || "chore: flatten repo structure via Cipher Terminal",
    tree: createdTree.sha,
    parents: [headSha],
  });

  // 6. Update branch ref
  await octokit.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha,
  });

  return res.status(200).json({
    status: "FILESYSTEM_FLATTEN_COMPLETE",
    commit: newCommit.sha,
  });
}
