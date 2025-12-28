// pages/api/siva-sandbox.js
// SIVA — SANDBOX PHASE
// Dry-run verification · No commits · No writes
// Calm judgment before action.

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
]);

function normalizePath(p) {
  return p.replace(/\\/g, "/").trim();
}

function isBlockedPath(path) {
  if (BLOCKED_PATH_EXACT.has(path)) return true;
  return BLOCKED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function hasSyntaxRedFlags(content) {
  const flags = [];
  if (content.includes("require(")) {
    flags.push("CommonJS require() detected — prefer ES imports");
  }
  if (content.includes("eval(")) {
    flags.push("eval() detected — blocked in sandbox");
  }
  return flags;
}

function checkImports(content, filePath) {
  const issues = [];
  const importRegex =
    /import\s+.*?\s+from\s+['"](.+?)['"]/g;

  let match;
  while ((match = importRegex.exec(content))) {
    const target = match[1];
    if (target.startsWith(".")) {
      // relative import sanity check
      if (!target.endsWith(".js") && !target.endsWith(".jsx")) {
        issues.push({
          type: "IMPORT_WARNING",
          file: filePath,
          message: `Relative import "${target}" has no extension`,
        });
      }
    }
  }

  return issues;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: "METHOD_NOT_ALLOWED",
    });
  }

  const { taskId, files } = req.body || {};

  if (!taskId || !Array.isArray(files)) {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error: "Missing taskId or files[]",
    });
  }

  const issues = [];
  let verdict = "CLEAN";

  for (const file of files) {
    const rawPath = file?.path;
    const content = file?.content;

    if (!rawPath) continue;

    const path = normalizePath(rawPath);

    // 🔒 Path safety
    if (isBlockedPath(path)) {
      issues.push({
        type: "BLOCKED_PATH",
        file: path,
        message: "Target path is blocked in sandbox",
      });
      verdict = "FAILED";
      continue;
    }

    // 🧠 Content checks
    if (typeof content === "string") {
      const redFlags = hasSyntaxRedFlags(content);
      if (redFlags.length > 0) {
        verdict = verdict === "FAILED" ? "FAILED" : "WARNINGS";
        redFlags.forEach((msg) =>
          issues.push({
            type: "SYNTAX_WARNING",
            file: path,
            message: msg,
          })
        );
      }

      const importIssues = checkImports(content, path);
      if (importIssues.length > 0) {
        verdict = verdict === "FAILED" ? "FAILED" : "WARNINGS";
        issues.push(...importIssues);
      }
    } else {
      // DESIGN_ONLY or missing content
      verdict = verdict === "FAILED" ? "FAILED" : "WARNINGS";
      issues.push({
        type: "NO_CONTENT",
        file: path,
        message: "No content provided (design-only or placeholder)",
      });
    }
  }

  return res.status(200).json({
    status: "SIVA_SANDBOX_OK",
    taskId,
    verdict,
    issues,
    summary:
      verdict === "CLEAN"
        ? "Sandbox passed with no issues"
        : verdict === "WARNINGS"
        ? "Sandbox completed with warnings"
        : "Sandbox failed — apply blocked",
  });
}
