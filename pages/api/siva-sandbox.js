// pages/api/siva-sandbox.js
// SIVA — SANDBOX PHASE
// Deterministic dry-run verification · No commits · No writes
// Judgment before action.

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

function analyzeContent(content) {
  const issues = [];

  if (content.includes("eval(")) {
    issues.push({
      type: "FORBIDDEN_SYNTAX",
      severity: "CRITICAL",
      message: "eval() detected — execution blocked",
    });
  }

  if (content.includes("require(")) {
    issues.push({
      type: "LEGACY_IMPORT",
      severity: "LOW",
      message: "CommonJS require() detected — prefer ES modules",
    });
  }

  const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  let match;
  while ((match = importRegex.exec(content))) {
    const target = match[1];
    if (target.startsWith(".") && !target.endsWith(".js") && !target.endsWith(".jsx")) {
      issues.push({
        type: "IMPORT_WARNING",
        severity: "MEDIUM",
        message: `Relative import "${target}" missing extension`,
      });
    }
  }

  return issues;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "METHOD_NOT_ALLOWED" });
  }

  const { taskId, files } = req.body || {};

  if (!taskId || !Array.isArray(files)) {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error: "Missing taskId or files[]",
    });
  }

  const issues = [];
  let score = 100;
  let verdict = "CLEAN";

  for (const file of files) {
    const path = normalizePath(file?.path || "");
    const content = file?.content;

    if (!path) continue;

    if (isBlockedPath(path)) {
      issues.push({
        file: path,
        type: "BLOCKED_PATH",
        severity: "CRITICAL",
        message: "Target path is blocked",
      });
      verdict = "FAILED";
      score -= 40;
      continue;
    }

    if (typeof content !== "string") {
      issues.push({
        file: path,
        type: "NO_CONTENT",
        severity: "MEDIUM",
        message: "No content provided (design-only or placeholder)",
      });
      verdict = verdict === "FAILED" ? "FAILED" : "WARNINGS";
      score -= 10;
      continue;
    }

    const contentIssues = analyzeContent(content);
    for (const issue of contentIssues) {
      issues.push({ file: path, ...issue });

      if (issue.severity === "CRITICAL") score -= 40;
      if (issue.severity === "MEDIUM") score -= 10;
      if (issue.severity === "LOW") score -= 5;

      verdict =
        issue.severity === "CRITICAL"
          ? "FAILED"
          : verdict === "CLEAN"
          ? "WARNINGS"
          : verdict;
    }
  }

  score = Math.max(0, score);

  const allowApply = verdict !== "FAILED";

  return res.status(200).json({
    status: "SIVA_SANDBOX_OK",
    taskId,
    verdict,
    confidence: score,
    allowApply,
    issues,
    summary:
      verdict === "CLEAN"
        ? "Sandbox passed with no issues"
        : verdict === "WARNINGS"
        ? "Sandbox passed with warnings"
        : "Sandbox failed — apply blocked",
    meta: {
      phase: "SANDBOX",
      timestamp: new Date().toISOString(),
      futureCompatible: true,
    },
  });
}
